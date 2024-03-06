import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { CreateReplenishmentDto } from "./dto/create-replenishment.dto";
import { InjectModel } from "@nestjs/mongoose";
import { Replenishment, ReplenishmentStatusEnum } from "./schemas/replenishment.schema";
import mongoose, { Model } from "mongoose";
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
import { IAmount } from "src/bets/schemas/bet.schema";
import { Account } from "src/admin/schemas/account.schema";

@Injectable()
export class ReplenishmentService {
  constructor(
    @InjectModel(Admin.name) private adminModel: Model<Admin>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Requisite.name) private requisiteModel: Model<Requisite>,
    @InjectModel(Replenishment.name) private replenishmentModel: Model<Replenishment>,
    @InjectModel(UserPromo.name) private userPromoModel: Model<UserPromo>,
    @InjectModel(Bonus.name) private bonusModel: Model<Bonus>,
    @InjectModel(Account.name) private accountModel: Model<Account>,
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
    const requisite = await this.requisiteModel.findOne({ _id: dto.requisite, active: true });

    if (!requisite) {
      throw new NotFoundException("Реквизит не найден");
    }

    const minLimit = await this.convertService.convert(admin.minLimit.currency, user.currency, admin.minLimit.amount);
    const maxLimit = await this.convertService.convert(admin.maxLimit.currency, user.currency, admin.maxLimit.amount);

    const amount: IAmount = {};
    const deduction: IAmount = {};

    for (const currency of admin.currencies) {
      amount[currency] = await this.convertService.convert(dto.currency, currency, dto.amount);
      const commission = await this.convertService.convert(admin.commissionCurrency, currency, admin.commission);
      deduction[currency] = amount[currency] + commission;
    }

    console.log(amount);

    if (amount[user.currency] < minLimit && amount[user.currency] > maxLimit) {
      throw new BadRequestException(`Сумма не должен бит не меньше чем ${minLimit + user.currency} и не больше чем ${maxLimit + user.currency}`);
    }

    // add sequence

    const accountsCount = (await this.accountModel.count({ requisite: requisite._id, balance: { $gte: amount["USDT"] } })) - 1;

    if (requisite.accountCount < accountsCount) {
      requisite.accountCount++;
    } else {
      requisite.accountCount = 0;
    }

    await requisite.save();

    const account = await this.accountModel
      .findOne({ requisite: requisite._id, balance: { $gte: amount["USDT"] } })
      .skip(accountsCount)
      .populate("requisites");

    if (!account) {
      throw new NotFoundException("Реквизит не найден");
    }

    const requisites = account.requisites.filter(req => req.active);

    if (account.selectedRequisiteDir < requisites.length) {
      account.selectedRequisiteDir++;
    } else {
      account.selectedRequisiteDir = 0;
    }

    await account.save();

    const replenishmentRequisite = requisites[account.selectedRequisiteDir];

    if (!replenishmentRequisite) {
      throw new NotFoundException("Реквизит не найден");
    }

    replenishmentRequisite.turnover.inProcess += amount[requisite.currency];

    const bonuses = await this.userPromoModel.find({ user: user._id }).populate("promo");

    let sum = 0;

    for (let bonus of bonuses) {
      if (bonus.limit >= amount[user.currency]) {
        sum += (dto.amount * bonus.promo.amount) / 100;
        bonus.limit -= amount[user.currency];
        await bonus.save();
      }
    }

    await replenishmentRequisite.save();

    const replenishment = await (
      await this.replenishmentModel.create({ ...dto, deduction, user: user._id, amount, account: account._id, requisite: replenishmentRequisite })
    ).populate("requisite");

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
      return { message: "Вы уже подтвердили оплату" };
    }
    replenishment.status = ReplenishmentStatusEnum.CANCELED;
    replenishment.statusMessage = "Отменена пользователем";

    await replenishment.save();

    this.schedulerRegistry.deleteCronJob(dto.id);

    return { message: "Пополнение отменена" };
  }

  async confirmReplenishment(dto: ConfirmReplenishmentDto) {
    const replenishment = await this.replenishmentModel.findById(dto.id).populate("requisite");

    if (replenishment.status === ReplenishmentStatusEnum.PENDING) {
      throw new BadRequestException("Эту заявку вы уже подтвердили");
    }

    replenishment.status = ReplenishmentStatusEnum.PENDING;
    replenishment.isPayConfirmed = true;

    await replenishment.save();

    this.schedulerRegistry.deleteCronJob(dto.id);

    return { message: "Оплата подтверждена" };
  }
}
