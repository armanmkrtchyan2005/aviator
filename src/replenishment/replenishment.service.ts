import { Injectable, NotFoundException } from "@nestjs/common";
import { CreateReplenishmentDto } from "./dto/create-replenishment.dto";
import { InjectModel } from "@nestjs/mongoose";
import { Replenishment, ReplenishmentStatusEnum } from "./schemas/replenishment.schema";
import { Model } from "mongoose";
import { User } from "src/user/schemas/user.schema";
import { Admin } from "src/admin/schemas/admin.schema";
import { IAuthPayload } from "src/auth/auth.guard";
import { ConvertService } from "src/convert/convert.service";
import { CancelReplenishmentDto } from "./dto/cancel-replenishment.dto";
import { ConfirmReplenishmentDto } from "./dto/confirm-replenishment.dto";
import { Requisite } from "src/admin/schemas/requisite.schema";
import { SchedulerRegistry, CronExpression } from "@nestjs/schedule";
import { CronJob } from "cron";

@Injectable()
export class ReplenishmentService {
  constructor(
    @InjectModel(Admin.name) private adminModel: Model<Admin>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Requisite.name) private requisiteModel: Model<Requisite>,
    @InjectModel(Replenishment.name) private replenishmentModel: Model<Replenishment>,
    private schedulerRegistry: SchedulerRegistry,
    private convertService: ConvertService,
  ) {}

  async findAll(userPayload: IAuthPayload) {
    const replenishments = await this.replenishmentModel
      .find({
        user: userPayload.id,
      })
      .populate("requisite");

    return replenishments;
  }

  async findOne(id: string) {
    const replenishment = await this.replenishmentModel.findById(id).populate("requisite");

    return replenishment;
  }

  async createReplenishment(userPayload: IAuthPayload, dto: CreateReplenishmentDto) {
    const admin = await this.adminModel.findOne();

    const user = await this.userModel.findById(userPayload.id);
    const requisite = await this.requisiteModel.findById(dto.requisite);

    if (!requisite) {
      throw new NotFoundException({ message: "Реквизит не найден" });
    }

    const deduction = dto.amount + (await this.convertService.convert(admin.commissionCurrency, dto.currency, admin.commission));

    const replenishment = await this.replenishmentModel.create({ ...dto, deduction, user: user._id });

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

  async cancelReplenishment(dto: CancelReplenishmentDto) {
    const replenishment = await this.replenishmentModel.findById(dto.id);
    if (!replenishment.isPayConfirmed) {
      return { message: "Невозможно отменить" };
    }
    replenishment.status = ReplenishmentStatusEnum.CANCELED;
    replenishment.statusMessage = "Отменена пользователем";

    await replenishment.save();

    this.schedulerRegistry.deleteCronJob(dto.id);

    return { message: "Пополнение отменена" };
  }

  async confirmReplenishment(dto: ConfirmReplenishmentDto) {
    const replenishment = await this.replenishmentModel.findById(dto.id).populate("requisite");

    replenishment.isPayConfirmed = true;

    await replenishment.save();

    this.schedulerRegistry.deleteCronJob(dto.id);

    return { message: "Оплата подтверждена" };
  }
}
