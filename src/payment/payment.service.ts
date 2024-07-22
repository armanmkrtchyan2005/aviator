import { BadRequestException, Injectable } from "@nestjs/common";
import { CreatePaymentDto } from "./dto/create-payment.dto";
import { InjectModel } from "@nestjs/mongoose";
import { Replenishment, ReplenishmentStatusEnum } from "src/replenishment/schemas/replenishment.schema";
import { Model } from "mongoose";
import * as crypto from "crypto";
import { AAIOSuccessPaymentDto } from "./dto/aaio-success-payment.dto";
import { User } from "src/user/schemas/user.schema";
import { ConvertService } from "src/convert/convert.service";
import { SchedulerRegistry } from "@nestjs/schedule";
import { FreekassaSuccessPaymentDto } from "./dto/freekassa-success-payment.dto";
import Big from "big.js";
import { Bonus, CoefParamsType } from "src/user/schemas/bonus.schema";
import { UserPromo } from "src/user/schemas/userPromo.schema";
import * as _ from "lodash";
import { SocketGateway } from "src/socket/socket.gateway";

@Injectable()
export class PaymentService {
  constructor(
    @InjectModel(Replenishment.name) private replenishmentModel: Model<Replenishment>,
    @InjectModel(Bonus.name) private bonusModel: Model<Bonus>,
    @InjectModel(UserPromo.name) private userPromoModel: Model<UserPromo>,
    private convertService: ConvertService,
    private socketGateway: SocketGateway,
  ) {}

  private md5(sign: string) {
    return crypto.createHash("md5").update(sign).digest("hex");
  }

  private createFirstSign(orderAmount: number, orderId: string, currency: string) {
    const str = process.env.FREEKASSA_MERCHANT_ID + ":" + orderAmount + ":" + process.env.FREEKASSA_FIRST_PHRASE + ":" + currency + ":" + orderId;
    console.log(str);

    return this.md5(str);
  }
  private createSecondSign(orderAmount: number, orderId: string) {
    const str = process.env.FREEKASSA_MERCHANT_ID + ":" + orderAmount + ":" + process.env.FREEKASSA_SECOND_PHRASE + ":" + orderId;
    return this.md5(str);
  }

  async createAAIOPayment(dto: CreatePaymentDto) {
    const replenishment = new this.replenishmentModel({ user: dto.user._id, amount: dto.amount, method: dto.requisite._id, acquiring: "AAIO", bonusAmount: dto.bonusAmount });

    const amount = dto.amount[dto.requisite.currency];
    const amountFromCommission = new Big(amount)
      .plus((amount * dto.requisite.commission) / 100)
      .round(2)
      .toNumber();

    let sign = [process.env.AAIO_MERCHANT_ID, amountFromCommission, dto.requisite.currency, process.env.AAIO_SECRET_KEY, replenishment._id.toString()].join(":");

    sign = crypto.createHash("sha256").update(sign).digest("hex");

    const url = new URL("https://aaio.so/merchant/pay");
    url.searchParams.append("merchant_id", process.env.AAIO_MERCHANT_ID);
    url.searchParams.append("amount", amountFromCommission.toString());
    url.searchParams.append("currency", dto.requisite.currency);
    url.searchParams.append("order_id", replenishment._id.toString());
    url.searchParams.append("sign", sign);
    url.searchParams.append("method", "");

    replenishment.paymentUrl = url.toString();

    await replenishment.save();

    return replenishment;
  }

  async createDonatePayPayment(dto: CreatePaymentDto) {
    const replenishment = new this.replenishmentModel({ user: dto.user._id, amount: dto.amount, method: dto.requisite._id, acquiring: "FREEKASSA", bonusAmount: dto.bonusAmount });
    const currency = dto.requisite.currency;

    const amountFromCommission = new Big(dto.amount[currency])
      .plus((dto.amount[currency] * dto.requisite.commission) / 100)
      .round(2)
      .toNumber();

    const paymentUrl =
      "https://pay.freekassa.com/" +
      `?m=${process.env.FREEKASSA_MERCHANT_ID}` +
      `&oa=${amountFromCommission}` +
      `&currency=${currency}` +
      `&o=${replenishment._id}` +
      `&s=${this.createFirstSign(amountFromCommission, replenishment._id.toString(), currency)}` +
      `&us_currency=${currency}`;

    replenishment.paymentUrl = paymentUrl;

    await replenishment.save();

    return replenishment;
  }

  async successPaymentAAIO(dto: AAIOSuccessPaymentDto) {
    const replenishment = await this.replenishmentModel.findById(dto.order_id).populate("user");

    const userAmount = replenishment.amount[replenishment.user.currency] + (replenishment.bonusAmount[replenishment.user.currency] || 0);
    replenishment.user.balance += userAmount;
    replenishment.status = ReplenishmentStatusEnum.COMPLETED;
    replenishment.completedDate = new Date();
    replenishment.paymentUrl = null;

    const { leader } = await replenishment.user.populate("leader");

    if (leader) {
      const userLeaderAmount = replenishment.amount[leader.currency];
      replenishment.user.sumReplenishment += userLeaderAmount;
    }

    const bonus = await this.bonusModel.findOne({ "coef_params.type": CoefParamsType.ADD_BALANCE });

    if (bonus) {
      const isUserPromoFined = await this.userPromoModel.findOne({ user: replenishment.user._id, bonus: bonus._id });
      console.log(isUserPromoFined);

      if (replenishment.amount["USD"] >= bonus.coef_params.from_amount && !isUserPromoFined) {
        const randomAmount = _.random(bonus.coef_params.amount_first, bonus.coef_params.amount_second);
        const amount = await this.convertService.convert("USD", replenishment.user.currency, randomAmount);
        await this.userPromoModel.create({ bonus: bonus._id, user: replenishment.user._id, amount, active: false });
      }
    }

    await replenishment.user.save();
    await replenishment.save();

    this.socketGateway.server.to(replenishment.user._id.toString()).emit("user-balance", replenishment.user.balance);
  }

  async successPaymentFreekassa(dto: FreekassaSuccessPaymentDto) {
    if (dto.SIGN !== this.createSecondSign(dto.AMOUNT, dto.MERCHANT_ORDER_ID)) {
      throw new BadRequestException("SIGN не подходит");
    }

    const replenishment = await this.replenishmentModel.findById(dto.MERCHANT_ORDER_ID).populate("user");

    const userAmount = replenishment.amount[replenishment.user.currency] + (replenishment.bonusAmount[replenishment.user.currency] || 0);
    replenishment.user.balance += userAmount;
    replenishment.status = ReplenishmentStatusEnum.COMPLETED;
    replenishment.completedDate = new Date();
    replenishment.paymentUrl = null;

    const { leader } = await replenishment.user.populate("leader");

    if (leader) {
      const userLeaderAmount = replenishment.amount[leader.currency];
      replenishment.user.sumReplenishment += userLeaderAmount;
    }

    const bonus = await this.bonusModel.findOne({ "coef_params.type": CoefParamsType.ADD_BALANCE });

    if (bonus) {
      const isUserPromoFined = await this.userPromoModel.findOne({ user: replenishment.user._id, bonus: bonus._id });
      console.log(isUserPromoFined);

      if (replenishment.amount["USD"] >= bonus.coef_params.from_amount && !isUserPromoFined) {
        const randomAmount = _.random(bonus.coef_params.amount_first, bonus.coef_params.amount_second);
        const amount = await this.convertService.convert("USD", replenishment.user.currency, randomAmount);
        await this.userPromoModel.create({ bonus: bonus._id, user: replenishment.user._id, amount, active: false });
      }
    }

    await replenishment.user.save();
    await replenishment.save();

    this.socketGateway.server.to(replenishment.user._id.toString()).emit("user-balance", replenishment.user.balance);

    return "YES";
  }
}
