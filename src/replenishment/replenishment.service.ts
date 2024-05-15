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
import { Requisite } from "src/admin/schemas/requisite.schema";
import { SchedulerRegistry, CronExpression, Cron } from "@nestjs/schedule";
import { CronJob } from "cron";
import { UserPromo } from "src/user/schemas/userPromo.schema";
import { Bonus } from "src/user/schemas/bonus.schema";
import * as _ from "lodash";
import { IAmount } from "src/bets/schemas/bet.schema";
import { Account } from "src/admin/schemas/account.schema";
import { Request } from "express";
import { ReplenishmentFilePipe } from "./pipes/replenishment-file.pipe";
import { AccountRequisiteDocument } from "src/admin/schemas/account-requisite.schema";
import { PaymentService } from "src/payment/payment.service";
import findRemoveSync from "find-remove";
import * as fs from "fs";

const REMOVE_FILES_SECONDS = 1209600; // 7 days in seconds;

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
    private paymentService: PaymentService,
  ) {}

  async findLimits(userPayload: IAuthPayload, id: string) {
    const requisite = await this.requisiteModel.findById(id);
    const user = await this.userModel.findById(userPayload.id, ["currency"]);

    const limits = [];

    if (requisite.profile && (!requisite.AAIO || !requisite.donatePay)) {
      limits.push(requisite.profileLimit?.min);
      limits.push(requisite.profileLimit?.max);
    }

    if (requisite.AAIO) {
      limits.push(requisite.AAIOlimit.min, requisite.AAIOlimit.max);
    }

    if (requisite.donatePay) {
      limits.push(requisite.donatePaylimit.min, requisite.donatePaylimit.max);
    }

    const min = _.min(limits);
    const max = _.max(limits);

    const minLimit = await this.convertService.convert(requisite.currency, user.currency, min);
    const maxLimit = await this.convertService.convert(requisite.currency, user.currency, max);

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
      .populate(["requisite", "method"]);

    return replenishments;

    // const replenishments = await this.replenishmentModel.aggregate([
    //   {
    //     $match: { user: userPayload.id },
    //   },
    //   {
    //     $lookup: {
    //       localField: "account",
    //       foreignField: "_id",
    //       from: "accounts",
    //       as: "account",
    //       pipeline: [{ $lookup: { localField: "requisite", foreignField: "_id", from: "requisites", as: "requisite" } }, { $unwind: "$requisite" }],
    //     },
    //   },
    //   { $unwind: "$account" },
    //   {
    //     $set: {
    //       method: "$account.requisite",
    //     },
    //   },
    //   { $project: { account: 0 } },
    // ]);
  }

  async findOne(id: string) {
    const replenishment = await this.replenishmentModel.findById(id).populate(["requisite", "method"]);

    return replenishment;

    // const replenishment = await this.replenishmentModel.aggregate([
    //   {
    //     $match: { _id: new mongoose.Types.ObjectId(id) },
    //   },
    //   {
    //     $lookup: {
    //       localField: "account",
    //       foreignField: "_id",
    //       from: "accounts",
    //       as: "account",
    //       pipeline: [{ $lookup: { localField: "requisite", foreignField: "_id", from: "requisites", as: "requisite" } }, { $unwind: "$requisite" }],
    //     },
    //   },
    //   { $unwind: "$account" },
    //   {
    //     $set: {
    //       requisite: "$account.requisite",
    //     },
    //   },
    //   { $project: { account: 0 } },
    //   { $limit: 1 },
    // ]);
  }

  async createReplenishment(userPayload: IAuthPayload, dto: CreateReplenishmentDto) {
    const admin = await this.adminModel.findOne();

    const user = await this.userModel.findById(userPayload.id);
    const requisite = await this.requisiteModel.findOne({ _id: dto.requisite, active: true });

    if (!requisite) {
      throw new NotFoundException("Реквизит не найден");
    }

    const amount: IAmount = {};
    const deduction: IAmount = {};
    const bonusAmount: IAmount = {};
    const commission: IAmount = {};

    for (const currency of admin.currencies) {
      bonusAmount[currency] = 0;
      // const commission = await this.convertService.convert(admin.commissionCurrency, currency, admin.commission);
      amount[currency] = await this.convertService.convert(dto.currency, currency, dto.amount);
      commission[currency] = (amount[currency] * requisite.commission) / 100;
      amount[currency] += commission[currency];
      deduction[currency] = amount[currency];
    }

    console.log(commission);

    //----------------- AAIO CODE ------------------

    if (requisite.AAIO) {
      if (deduction[requisite.currency] >= requisite.AAIOlimit.min && deduction[requisite.currency] <= requisite.AAIOlimit.max) {
        // --------------------------
        return await this.paymentService.createAAIOPayment({ user, amount, requisite });
      }
    }

    //-------------- Freekassa CODE -----------------

    if (requisite.donatePay) {
      if (deduction[requisite.currency] >= requisite.donatePaylimit.min && deduction[requisite.currency] <= requisite.donatePaylimit.max) {
        // --------------------------
        return await this.paymentService.createDonatePayPayment({ user, amount, requisite });
      }
    }

    if (!requisite.profile) {
      throw new NotFoundException("Реквизит не найден");
    }
    console.log("amount: ", amount);

    const minLimit = requisite.profileLimit?.min;
    const maxLimit = requisite.profileLimit?.min;

    if (deduction[requisite.currency] < minLimit && deduction[requisite.currency] > maxLimit) {
      throw new BadRequestException(`Сумма не должен бит не меньше чем ${minLimit + user.currency} и не больше чем ${maxLimit + user.currency}`);
    }

    const accountsCount = (await this.accountModel.count({ requisite: requisite._id, balance: { $gte: amount["USDT"] } })) - 1;

    if (requisite.accountCount < accountsCount) {
      requisite.accountCount++;
    } else {
      requisite.accountCount = 0;
    }

    await requisite.save();

    const account = await this.accountModel
      .findOne({ requisite: requisite._id, balance: { $gte: amount["USDT"] } })
      .skip(requisite.accountCount)
      .populate("requisites");

    if (!account) {
      throw new NotFoundException("Реквизит не найден");
    }

    const requisites = account.requisites.filter(req => req.active);

    if (account.selectedRequisiteDir < requisites.length - 1) {
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

    for (const currency of admin.currencies) {
      deduction[currency] += (deduction[currency] * account.replenishmentBonus) / 100;
    }

    const bonuses = await this.userPromoModel.find({ user: user._id }).populate("promo");

    for (let bonus of bonuses) {
      if (bonus.limit >= amount[user.currency]) {
        for (const currency of admin.currencies) {
          const promoAmount = await this.convertService.convert(bonus.promo.currency, currency, amount[bonus.promo.currency]);
          bonusAmount[currency] += (amount[currency] * promoAmount) / 100;
        }
        bonus.limit -= amount[user.currency];
        await bonus.save();
      }
    }

    await replenishmentRequisite.save();

    const replenishment = await (
      await this.replenishmentModel.create({
        ...dto,
        deduction,
        commission,
        user: user._id,
        amount,
        account: account._id,
        requisite: replenishmentRequisite,
        method: requisite,
        bonusAmount,
      })
    ).populate(["requisite", "method"]);

    const job = new CronJob(CronExpression.EVERY_30_MINUTES, async () => {
      console.log("Time out");
      replenishment.status = ReplenishmentStatusEnum.CANCELED;
      replenishment.statusMessage = "По истечении времени";
      try {
        fs.rmSync(replenishment.receipt);
        replenishment.receipt = "";
      } catch (error) {}
      await replenishment.save();
      this.schedulerRegistry.deleteCronJob(replenishment._id.toString());
    });

    this.schedulerRegistry.addCronJob(replenishment._id.toString(), job);
    job.start();

    return replenishment;
  }

  async cancelReplenishment(dto: CancelReplenishmentDto) {
    const replenishment = await this.replenishmentModel.findById(dto.id);
    if (replenishment.isPayConfirmed) {
      return { message: "Вы уже подтвердили оплату" };
    }
    replenishment.status = ReplenishmentStatusEnum.CANCELED;
    replenishment.statusMessage = "Отменена пользователем";

    try {
      fs.rmSync(replenishment.receipt);
      replenishment.receipt = "";
    } catch (error) {}

    await replenishment.save();

    try {
      this.schedulerRegistry.deleteCronJob(dto.id);
    } catch (error) {}

    return { message: "Пополнение отменено" };
  }

  async confirmReplenishment(id: string, receiptFile: Express.Multer.File) {
    const replenishment = await this.replenishmentModel.findById(id).populate("requisite");

    const requisite = replenishment.requisite as AccountRequisiteDocument;

    if (replenishment.status !== ReplenishmentStatusEnum.PENDING) {
      throw new BadRequestException("Эту заявку вы уже подтвердили");
    }

    if (requisite.isReceiptFileRequired && !receiptFile) {
      throw new BadRequestException("Квитанция об оплате обязательна");
    }

    if (requisite.isCardFileRequired && !replenishment.card) {
      throw new BadRequestException("Карта обязательна");
    }

    let receipt = await new ReplenishmentFilePipe().transform(receiptFile);

    replenishment.status = ReplenishmentStatusEnum.PROCESSING;
    replenishment.isPayConfirmed = true;
    replenishment.receipt = receipt;

    await replenishment.save();

    try {
      this.schedulerRegistry.deleteCronJob(id);
    } catch (error) {}

    return { message: "Оплата подтверждена" };
  }

  async verifyReplenishment(id: string, cardFile: Express.Multer.File) {
    const replenishment = await this.replenishmentModel.findById(id).populate("requisite");

    const requisite = replenishment.requisite as AccountRequisiteDocument;

    if (!requisite.isCardFileRequired) {
      return { message: "Фото карты не обязательна" };
    }

    if (!cardFile) {
      throw new BadRequestException("Карта обязательна");
    }

    const card = await new ReplenishmentFilePipe().transform(cardFile);

    replenishment.card = card;

    replenishment.createdAt = new Date();

    await replenishment.save();

    return { message: "Карта добавлена" };
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleCron() {
    findRemoveSync(__dirname + "/uploads/files", { age: { seconds: REMOVE_FILES_SECONDS } });
  }
}
