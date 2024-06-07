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
import { AccountRequisite, AccountRequisiteDocument } from "src/admin/schemas/account-requisite.schema";
import { PaymentService } from "src/payment/payment.service";
import * as fs from "fs";
import Big from "big.js";
import * as path from "path";
import { findRemove } from "src/utils/findRemove";

const REMOVE_FILES_MS = 1209600000; // 14 days in seconds;
const TIMEOUT_MS = 1000 * 60 * 30; // 30 minutes

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
    @InjectModel(AccountRequisite.name) private accountRequisiteModel: Model<AccountRequisite>,
    private schedulerRegistry: SchedulerRegistry,
    private convertService: ConvertService,
    private paymentService: PaymentService,
  ) {}

  async findLimits(userPayload: IAuthPayload, id: string) {
    const requisite = await this.requisiteModel.findById(id);
    const user = await this.userModel.findById(userPayload.id, ["currency"]);

    const limits = [];

    let accounts = await this.accountModel
      .aggregate()
      .match({
        requisite: requisite._id,
        balance: {
          $gt: 0,
        },
        requisites: {
          $exists: true,
          $ne: [],
        },
      })
      .lookup({ from: "accountrequisites", localField: "requisites", foreignField: "_id", as: "requisites" })
      .unwind("requisites")
      .match({
        "requisites.active": true,
      });

    if (requisite.profile && accounts.length) {
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
      .populate(["requisite", "method"])
      .sort({ createdAt: -1 });

    return replenishments;
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
    const accrualAmount: IAmount = {};

    const bonuses = await this.userPromoModel.find({ user: user._id, limit: { $exists: true } }).populate("promo");

    for (const currency of admin.currencies) {
      bonusAmount[currency] = 0;
      // const commission = await this.convertService.convert(admin.commissionCurrency, currency, admin.commission);
      amount[currency] = await this.convertService.convert(dto.currency, currency, dto.amount);
      deduction[currency] = amount[currency];
      commission[currency] = (amount[currency] * requisite.commission) / 100;
      deduction[currency] = new Big(deduction[currency]).plus(commission[currency]).toNumber();
    }

    for (let bonus of bonuses) {
      if (bonus.limit >= amount[user.currency]) {
        for (const currency of admin.currencies) {
          bonusAmount[currency] += (amount[currency] * bonus.promo.amount) / 100;
        }
        bonus.limit -= amount[user.currency];
      } else {
        for (const currency of admin.currencies) {
          const limitAmount = await this.convertService.convert(user.currency, currency, bonus.limit);
          bonusAmount[currency] += (limitAmount * bonus.promo.amount) / 100;
        }
        bonus.limit -= bonus.limit;
        await bonus.deleteOne();
      }
    }

    //----------------- AAIO CODE ------------------

    if (requisite.AAIO) {
      if (amount[requisite.currency] >= requisite.AAIOlimit.min && amount[requisite.currency] <= requisite.AAIOlimit.max) {
        // --------------------------
        return await this.paymentService.createAAIOPayment({ user, amount, requisite, bonusAmount });
      }
    }

    //-------------- Freekassa CODE -----------------

    if (requisite.donatePay) {
      if (amount[requisite.currency] >= requisite.donatePaylimit.min && amount[requisite.currency] <= requisite.donatePaylimit.max) {
        // --------------------------
        return await this.paymentService.createDonatePayPayment({ user, amount, requisite, bonusAmount });
      }
    }

    if (!requisite.profile) {
      throw new NotFoundException("Реквизит не найден");
    }

    const minLimit = requisite.profileLimit?.min;
    const maxLimit = requisite.profileLimit?.min;

    if (deduction[requisite.currency] < minLimit && deduction[requisite.currency] > maxLimit) {
      throw new BadRequestException(`Сумма не должен бит не меньше чем ${minLimit + user.currency} и не больше чем ${maxLimit + user.currency}`);
    }

    const accounts = await this.accountModel
      .aggregate()
      .match({
        requisite: requisite._id,
        balance: {
          $gte: amount["USDT"],
        },
        requisites: {
          $exists: true,
          $ne: [],
        },
      })
      .lookup({ from: "requisites", localField: "requisite", foreignField: "_id", as: "requisite" })
      .unwind("requisite")
      .lookup({ from: "accountrequisites", localField: "requisites", foreignField: "_id", as: "requisites" })
      .match({
        "requisite.active": true,
        "requisite.replenishment": true,
        "requisite.profile": true,
        "requisites.active": true,
      });

    if (requisite.accountCount < accounts.length - 1) {
      requisite.accountCount++;
    } else {
      requisite.accountCount = 0;
    }

    const account = accounts[requisite.accountCount];

    if (!account) {
      throw new NotFoundException("Реквизит не найден");
    }

    if (account.selectedRequisiteDir < account.requisites.length - 1) {
      account.selectedRequisiteDir++;
    } else {
      account.selectedRequisiteDir = 0;
    }

    await this.accountModel.findByIdAndUpdate(account._id, { $set: { selectedRequisiteDir: account.selectedRequisiteDir } });

    const replenishmentRequisite = account.requisites[account.selectedRequisiteDir];

    if (!replenishmentRequisite) {
      throw new NotFoundException("Реквизит не найден");
    }

    replenishmentRequisite.turnover.inProcess += amount[requisite.currency];

    for (const currency of admin.currencies) {
      accrualAmount[currency] = amount[currency] - (amount[currency] * account.replenishmentBonus) / 100;
    }

    await this.accountRequisiteModel.findByIdAndUpdate(replenishmentRequisite._id, { $set: { turnover: replenishmentRequisite.turnover } });

    const replenishment = await (
      await this.replenishmentModel.create({
        ...dto,
        deduction,
        commission,
        user: user._id,
        amount,
        accrualAmount,
        account: account._id,
        requisite: replenishmentRequisite._id,
        method: requisite._id,
        bonusAmount,
      })
    ).populate(["requisite", "method"]);

    const timeoutId = setTimeout(async () => {
      console.log("Time out");
      replenishment.status = ReplenishmentStatusEnum.CANCELED;
      replenishment.statusMessage = "По истечении времени";
      replenishment.completedDate = new Date();
      try {
        fs.rmSync(replenishment.receipt);
        replenishment.receipt = "";
      } catch (error) {}
      await replenishment.save();
    }, TIMEOUT_MS);

    this.schedulerRegistry.addTimeout(replenishment._id.toString(), timeoutId);

    return replenishment;
  }

  async cancelReplenishment(dto: CancelReplenishmentDto) {
    const replenishment = await this.replenishmentModel.findById(dto.id);
    if (replenishment.isPayConfirmed || replenishment.status !== ReplenishmentStatusEnum.PENDING) {
      return { message: "Вы уже подтвердили оплату" };
    }

    replenishment.status = ReplenishmentStatusEnum.CANCELED;
    replenishment.statusMessage = "Отменена пользователем";
    replenishment.completedDate = new Date();

    try {
      fs.rmSync(replenishment.receipt);
      replenishment.receipt = "";
    } catch (error) {}

    await replenishment.save();

    try {
      this.schedulerRegistry.deleteCronJob(dto.id);
    } catch (error) {}

    return { message: "Заявка на пополнение отменена" };
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
    const uploadDir = path.resolve("uploads", "files");
    findRemove(uploadDir, REMOVE_FILES_MS);
  }
}
