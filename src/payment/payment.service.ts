import { Injectable } from "@nestjs/common";
import { CreatePaymentDto } from "./dto/create-payment.dto";
import { InjectModel } from "@nestjs/mongoose";
import { Replenishment, ReplenishmentStatusEnum } from "src/replenishment/schemas/replenishment.schema";
import { Model } from "mongoose";
import * as crypto from "crypto";
import { SuccessPaymentDto } from "./dto/success-payment.dto";
import { User } from "src/user/schemas/user.schema";
import { ConvertService } from "src/convert/convert.service";
import { CronExpression, SchedulerRegistry } from "@nestjs/schedule";
import { CronJob } from "cron";

@Injectable()
export class PaymentService {
  constructor(
    @InjectModel(Replenishment.name) private replenishmentModel: Model<Replenishment>,
    @InjectModel(User.name) private userModel: Model<User>,
    private convertService: ConvertService,
    private schedulerRegistry: SchedulerRegistry,
  ) {}

  async createAAIOPayment(dto: CreatePaymentDto) {
    const replenishment = new this.replenishmentModel({ user: dto.user._id, amount: dto.amount, method: dto.requisite });

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
    url.searchParams.append("us_user_id", dto.user._id.toString());

    replenishment.paymentUrl = url.toString();

    await replenishment.save();

    const job = new CronJob(CronExpression.EVERY_30_MINUTES, async () => {
      console.log("Time out");
      replenishment.status = ReplenishmentStatusEnum.CANCELED;
      replenishment.statusMessage = "По истечении времени";
      await replenishment.save();
      this.schedulerRegistry.deleteCronJob(replenishment._id.toString());
    });

    this.schedulerRegistry.addCronJob(replenishment._id.toString(), job);
    job.start();

    return replenishment;
  }

  async createDonatePayPayment(dto: CreatePaymentDto) {
    return {
      method: "DonatePay",
      paymentUrl: "/",
    };
  }

  async successPaymentAAIO(dto: SuccessPaymentDto) {
    const user = await this.userModel.findById(dto.us_user_id);
    const replenishment = await this.replenishmentModel.findById(dto.order_id);

    const amount = await this.convertService.convert(dto.currency, user.currency, dto.amount);

    user.balance += amount;
    replenishment.status = ReplenishmentStatusEnum.COMPLETED;
    replenishment.paymentUrl = null;

    await user.save();
    await replenishment.save();
  }
}
