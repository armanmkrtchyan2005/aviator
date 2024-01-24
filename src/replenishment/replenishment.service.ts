import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
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
import { UserPromo } from "src/user/schemas/userPromo.schema";
import { PromoType } from "src/user/schemas/promo.schema";
import { Bonus, CoefParamsType } from "src/user/schemas/bonus.schema";
import * as _ from "lodash";

@Injectable()
export class ReplenishmentService {
  constructor(
    @InjectModel(Admin.name) private adminModel: Model<Admin>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Requisite.name) private requisiteModel: Model<Requisite>,
    @InjectModel(Replenishment.name) private replenishmentModel: Model<Replenishment>,
    @InjectModel(UserPromo.name) private userPromoModel: Model<UserPromo>,
    @InjectModel(Bonus.name) private bonusModel: Model<Bonus>,
    private schedulerRegistry: SchedulerRegistry,
    private convertService: ConvertService,
  ) {}

  async findLimits(userPayload: IAuthPayload) {
    const user = await this.userModel.findById(userPayload.id, ["currency"]);

    const admin = await this.adminModel.findOne({}, ["minLimit", "maxLimit"]);

    const minLimit = await this.convertService.convert(admin.minLimit.currency, user.currency, admin.minLimit.amount);
    const maxLimit = await this.convertService.convert(admin.maxLimit.currency, user.currency, admin.maxLimit.amount);

    return { minLimit, maxLimit, currency: user.currency };
  }

  async commission(userPayload: IAuthPayload) {
    const user = await this.userModel.findById(userPayload.id, ["currency"]);
    const admin = await this.adminModel.findOne({}, ["commission", "commissionCurrency"]);

    const commission = await this.convertService.convert(admin.commissionCurrency, user.currency, admin.commission);

    return { commission, currency: user.currency };
  }

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

    const minLimit = await this.convertService.convert(admin.minLimit.currency, dto.currency, admin.minLimit.amount);
    const maxLimit = await this.convertService.convert(admin.maxLimit.currency, dto.currency, admin.maxLimit.amount);

    if (dto.amount < minLimit && dto.amount > maxLimit) {
      throw new BadRequestException(`Сумма не должен бит не меньше чем ${minLimit + dto.currency} и не больше чем ${maxLimit + dto.currency}`);
    }
    const commission = await this.convertService.convert(admin.commissionCurrency, dto.currency, admin.commission);
    const deduction = dto.amount + commission;

    const bonuses = await this.userPromoModel.find({ user: user._id }).populate("promo");
    const amount = await this.convertService.convert(dto.currency, user.currency, dto.amount);
    let sum = 0;

    for (let bonus of bonuses) {
      if (bonus.limit >= amount) {
        sum += (dto.amount * bonus.promo.amount) / 100;
        bonus.limit -= amount;
        await bonus.save();
      }
    }

    // const addBalanceBonuses = await this.bonusModel.find({
    //   active: true,
    //   coef_params: { type: CoefParamsType.ADD_BALANCE },
    //   $or: [{ coef_params: { to_user_id: null } }, { coef_params: { to_user_id: user._id } }],
    // });

    // for(let addBalanceBonus of addBalanceBonuses) {
    //   const amount = _.random(addBalanceBonus.coef_params.amount_first, addBalanceBonus.coef_params.amount_second);

    //   addBalanceBonus
    // }

    // dto.amount += sum;

    const replenishment = await (await this.replenishmentModel.create({ ...dto, deduction, user: user._id })).populate("requisite");

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
