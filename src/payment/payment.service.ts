import { BadRequestException, Injectable } from "@nestjs/common";
import { CreatePaymentDto } from "./dto/create-payment.dto";
import { InjectModel } from "@nestjs/mongoose";
import { Replenishment, ReplenishmentStatusEnum } from "src/replenishment/schemas/replenishment.schema";
import { Model } from "mongoose";
import * as crypto from "crypto";
import { AAIOSuccessPaymentDto } from "./dto/aaio-success-payment.dto";
import { User } from "src/user/schemas/user.schema";
import { ConvertService } from "src/convert/convert.service";
import { CronExpression, SchedulerRegistry } from "@nestjs/schedule";
import { CronJob } from "cron";
import { FreekassaSuccessPaymentDto } from "./dto/freekassa-success-payment.dto";

@Injectable()
export class PaymentService {
  constructor(
    @InjectModel(Replenishment.name) private replenishmentModel: Model<Replenishment>,
    @InjectModel(User.name) private userModel: Model<User>,
    private convertService: ConvertService,
    private schedulerRegistry: SchedulerRegistry,
  ) {}

  private md5(sign: string) {
    return crypto.createHash("md5").update(sign).digest("hex");
  }

  private createFirstSign(orderAmount: number, orderId: string, currency: string) {
    return this.md5(process.env.FREEKASSA_MERCHANT_ID + ":" + orderAmount + ":" + process.env.FREEKASSA_FIRST_PHRASE + ":" + currency + ":" + orderId);
  }
  private createSecondSign(orderAmount: number, orderId: string) {
    return this.md5(process.env.FREEKASSA_MERCHANT_ID + ":" + orderAmount + ":" + process.env.FREEKASSA_SECOND_PHRASE + ":" + orderId);
  }

  async createAAIOPayment(dto: CreatePaymentDto) {
    const replenishment = new this.replenishmentModel({ user: dto.user._id, amount: dto.amount, method: dto.requisite._id });

    const amount = dto.amount[dto.requisite.currency].toString();

    let sign = [process.env.AAIO_MERCHANT_ID, amount, dto.requisite.currency, process.env.AAIO_SECRET_KEY, replenishment._id.toString()].join(":");

    sign = crypto.createHash("sha256").update(sign).digest("hex");

    const url = new URL("https://aaio.so/merchant/pay");
    url.searchParams.append("merchant_id", process.env.AAIO_MERCHANT_ID);
    url.searchParams.append("amount", amount);
    url.searchParams.append("currency", dto.requisite.currency);
    url.searchParams.append("order_id", replenishment._id.toString());
    url.searchParams.append("sign", sign);
    url.searchParams.append("method", "");

    replenishment.paymentUrl = url.toString();

    await replenishment.save();

    return replenishment;
  }

  async createDonatePayPayment(dto: CreatePaymentDto) {
    const replenishment = new this.replenishmentModel({ user: dto.user._id, amount: dto.amount, method: dto.requisite._id });
    const currency = dto.user.currency;
    const paymentUrl =
      "https://pay.freekassa.ru/" +
      `?m=${process.env.FREEKASSA_MERCHANT_ID}` +
      `&oa=${dto.amount[currency]}` +
      `&currency=${currency}` +
      `&o=${replenishment._id}` +
      `&s=${this.createFirstSign(dto.amount[currency], replenishment._id.toString(), dto.user.currency)}` +
      `$us_currency=${currency}`;

    replenishment.paymentUrl = paymentUrl;

    await replenishment.save();

    return replenishment;
  }

  async successPaymentAAIO(dto: AAIOSuccessPaymentDto) {
    const replenishment = await this.replenishmentModel.findById(dto.order_id).populate("user");

    const amount = await this.convertService.convert(dto.currency, replenishment.user.currency, dto.amount);
    console.log(amount);

    replenishment.user.balance += amount;
    replenishment.status = ReplenishmentStatusEnum.COMPLETED;
    replenishment.completedDate = new Date();
    replenishment.paymentUrl = null;

    await replenishment.user.save();
    await replenishment.save();
  }

  async successPaymentFreekassa(dto: FreekassaSuccessPaymentDto) {
    if (dto.SIGN !== this.createSecondSign(dto.AMOUNT, dto.MERCHANT_ORDER_ID)) {
      throw new BadRequestException("SIGN не подходит");
    }

    const replenishment = await this.replenishmentModel.findById(dto.MERCHANT_ORDER_ID).populate("user");

    const amount = await this.convertService.convert(dto.us_currency, replenishment.user.currency, dto.AMOUNT);

    replenishment.user.balance += amount;
    replenishment.status = ReplenishmentStatusEnum.COMPLETED;
    replenishment.completedDate = new Date();
    replenishment.paymentUrl = null;

    await replenishment.user.save();
    await replenishment.save();

    return "YES";
  }
}
