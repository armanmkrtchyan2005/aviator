import * as bcrypt from "bcrypt";
import * as fs from "fs";
import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { User } from "./schemas/user.schema";
import mongoose, { Model } from "mongoose";
import { IAuthPayload } from "src/auth/auth.guard";
import { salt } from "src/auth/auth.service";
import { SendCodeDto } from "src/auth/dto/send-code.dto";
import { ConfirmCodeDto } from "src/auth/dto/confirm-code.dto";
import { JwtService } from "@nestjs/jwt";
import { MailService, SendEmailType } from "src/mail/mail.service";
import { OldPasswordConfirmDto } from "./dto/old-password-confirm.dto";
import { ChangePasswordDto } from "src/auth/dto/change-password.dto";
import { AddPromoDto } from "./dto/add-promo.dto";
import { ConvertService } from "src/convert/convert.service";
import { Requisite } from "src/admin/schemas/requisite.schema";
import { Admin } from "src/admin/schemas/admin.schema";
import { Referral } from "./schemas/referral.schema";
import { FindReferralsByDayDto } from "./dto/findReferralsByDay.dto";
import { Promo, PromoSchema, PromoType } from "./schemas/promo.schema";
import { UserPromo } from "./schemas/userPromo.schema";
import { GetPromosDto } from "./dto/getPromos.dto";
import * as url from "url";
import * as path from "path";
import { generateCode } from "src/admin/common/utils/generate-code";
import { CronJob } from "cron";
import { Cron, CronExpression, SchedulerRegistry } from "@nestjs/schedule";
import { Account } from "src/admin/schemas/account.schema";
import { RequisiteDto, RequisiteTypeEnum } from "./dto/requisite.dto";
import * as _ from "lodash";
import { HOURS48 } from "src/constants";

type CurrencyPercentageRangesType = Record<string, { min: number; max: number; percentage: number }[]>;

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Promo.name) private promoModel: Model<Promo>,
    @InjectModel(UserPromo.name) private userPromoModel: Model<UserPromo>,
    @InjectModel(Requisite.name) private requisiteModel: Model<Requisite>,
    @InjectModel(Admin.name) private adminModel: Model<Admin>,
    @InjectModel(Referral.name) private referralModel: Model<Referral>,
    @InjectModel(Account.name) private accountModel: Model<Account>,
    private jwtService: JwtService,
    private mailService: MailService,
    private convertService: ConvertService,
    private schedulerRegistry: SchedulerRegistry,
  ) {}

  async findMe(auth: IAuthPayload) {
    const user = await this.userModel.findById(auth.id, { uid: true, telegramId: true, login: true, email: true, profileImage: true, twoFA: true });

    return user;
  }

  async findGameLimits(authPayload: IAuthPayload) {
    const user = await this.userModel.findById(authPayload.id);
    if (!user) {
      throw new UnauthorizedException();
    }
    const { gameLimits } = await this.adminModel.findOne({}, ["gameLimits"]);
    const min = gameLimits.min[user.currency];
    const max = gameLimits.max[user.currency];
    const maxWin = gameLimits.maxWin[user.currency];

    return { min, max, maxWin, currency: user.currency };
  }

  async myBalance(auth: IAuthPayload) {
    const user = await this.userModel.findById(auth.id, ["balance", "currency"]);

    return user;
  }

  async referral(auth: IAuthPayload) {
    const user = await this.userModel.findById(auth.id, { currency: true, referralBalance: true, descendants: true });
    const descendants = user?.descendants;
    return { ...user.toJSON(), descendants };
  }

  async findReferralsByDay(auth: IAuthPayload, query: FindReferralsByDayDto) {
    const referrals = await this.referralModel
      .aggregate()
      .match({ user: new mongoose.Types.ObjectId(auth.id) })
      .skip(query.skip)
      .limit(query.limit)
      .project({ totalEarned: "$earned", date: "$createdAt" });

    return referrals;
  }

  async confirmEmailSendCode(userPayload: IAuthPayload) {
    const user = await this.userModel.findById(userPayload.id);
    const now = new Date();

    if (user.emailUpdatedAt && now.getMilliseconds() - user.emailUpdatedAt.getMilliseconds() <= HOURS48) {
      throw new BadRequestException("Невозможно выполнить действие. Попробуйте позже.");
    }

    const code = generateCode();
    const token = this.jwtService.sign({ id: user._id, code }, { expiresIn: 60 * 60 * 4 });
    user.codeToken = token;

    await user.save();

    await this.mailService.sendUserForgotCode({ code, email: user.email, type: SendEmailType.CHANGE, login: user.login });

    return { message: "На ваш Email отправлен код для подтверждения" };
  }

  async confirmEmailConfirmCode(userPayload: IAuthPayload, dto: ConfirmCodeDto) {
    try {
      const user = await this.userModel.findById(userPayload.id);
      const payload = await this.jwtService.verifyAsync(user.codeToken);
      if (payload.code !== dto.code) {
        throw new BadRequestException("Неверный код");
      }

      return { message: "Ваш email подтверждён" };
    } catch (error) {
      throw new BadRequestException("Неверный код");
    }
  }

  async changeEmailSendCode(dto: SendCodeDto, userPayload: IAuthPayload) {
    const userFromEmail = await this.userModel.findOne({
      email: dto.email,
    });

    if (userFromEmail) {
      throw new BadRequestException("Невозможно привязать данный Email");
    }

    const user = await this.userModel.findById(userPayload.id);
    const now = new Date();

    if (user.emailUpdatedAt && now.getMilliseconds() - user.emailUpdatedAt.getMilliseconds() <= HOURS48) {
      throw new BadRequestException("Невозможно выполнить действие. Попробуйте позже.");
    }

    const code = generateCode();
    const token = this.jwtService.sign({ id: user._id, code, email: dto.email }, { expiresIn: 60 * 60 * 4 });
    user.codeToken = token;

    await user.save();

    await this.mailService.sendUserForgotCode({ code, email: dto.email, login: user.login, type: SendEmailType.CHANGE });

    return { message: "На ваш Email отправлен код для подтверждения" };
  }

  async changeEmailConfirmCode(userPayload: IAuthPayload, dto: ConfirmCodeDto) {
    try {
      const user = await this.userModel.findById(userPayload.id);
      const payload = await this.jwtService.verifyAsync(user.codeToken);
      if (payload.code !== dto.code) {
        throw new BadRequestException("Неверный код");
      }

      user.email = payload.email;
      user.emailUpdatedAt = new Date();
      user.codeToken = "";

      await user.save();

      return { message: "Ваш email успешно изменен" };
    } catch (error) {
      throw new BadRequestException("Неверный код");
    }
  }

  async oldPasswordConfirm(dto: OldPasswordConfirmDto, userPayload: IAuthPayload) {
    const user = await this.userModel.findById(userPayload.id);

    const isConfirmed = bcrypt.compareSync(dto.password, user.password);

    if (!isConfirmed) {
      throw new BadRequestException("Неверный пароль");
    }

    const token = await this.jwtService.signAsync({ id: user._id }, { expiresIn: 60 * 60 * 10 });

    return { token };
  }

  async changePassword(dto: ChangePasswordDto, token: string) {
    try {
      const payload = await this.jwtService.verifyAsync(token);

      const user = await this.userModel.findById(payload.id);

      if (!user) {
        throw new BadRequestException("Неправильные данные");
      }

      const hashedPassword = bcrypt.hashSync(dto.password, salt);

      user.password = hashedPassword;

      await user.save();

      return {
        message: "Ваш пароль успешно изменен",
      };
    } catch (error) {
      throw new BadRequestException("Неправильные данные");
    }
  }

  async addPromo(dto: AddPromoDto, authPayload: IAuthPayload) {
    const user = await this.userModel.findById(authPayload.id);

    if (!user) {
      throw new UnauthorizedException();
    }

    const promo = await this.promoModel.findOne({ name: dto.promoCode }, ["type", "will_finish", "coef", "amount", "currency", "limit", "max_count"]);

    if (!promo) {
      throw new NotFoundException("Промокод не найден");
    }

    if (promo.used_count >= promo.max_count) {
      throw new NotFoundException("Промокод не найден");
    }

    const date = new Date(promo.will_finish.split(".").reverse().join("-"));
    const now = new Date();

    if (now > date) {
      throw new NotFoundException("Промокод не найден");
    }

    const userPromo = await this.userPromoModel.findOne({ user: user._id, promo: promo._id });

    if (userPromo) {
      throw new BadRequestException("У вас уже есть такой промокод");
    }

    const newUserPromo = await this.userPromoModel.create({ user: user._id, promo: promo._id });

    if (promo.type === PromoType.PROMO) {
      newUserPromo.amount = await this.convertService.convert(promo.currency, user.currency, promo.amount);
    }

    if (promo.type === PromoType.ADD_BALANCE) {
      newUserPromo.limit = await this.convertService.convert(promo.currency, user.currency, promo.limit);
    }

    await newUserPromo.save();

    promo.used_count++;

    await promo.save();

    return promo;
  }

  async getPromos(dto: GetPromosDto, userPayload: IAuthPayload) {
    const user = await this.userModel.findById(userPayload.id);

    const userPromos = await this.userPromoModel
      .aggregate([
        { $match: { user: user._id, promo: { $ne: null }, active: false } },
        { $lookup: { from: "promos", localField: "promo", foreignField: "_id", as: "promo" } },
        { $unwind: "$promo" },
        { $match: { "promo.type": dto.type } },
        {
          $addFields: {
            "promo.currency": user.currency,
            "promo.limit": { $cond: [{ $eq: [dto.type, PromoType.ADD_BALANCE] }, "$limit", null] },
            "promo.amount": { $cond: [{ $eq: [dto.type, PromoType.PROMO] }, "$amount", "$promo.amount"] },
          },
        },
        {
          $project: {
            _id: 0,
            "promo.name": 0,
            "promo.used_count": 0,
            "promo.max_count": 0,
          },
        },
      ])
      .replaceRoot("$promo");
    let userBonuses = [];
    if (dto.type === PromoType.PROMO) {
      userBonuses = await this.userPromoModel.aggregate([
        { $match: { user: user._id, bonus: { $ne: null }, active: false } },
        { $lookup: { from: "bonus", localField: "bonus", foreignField: "_id", as: "bonus" } },
        { $unwind: "$bonus" },
        {
          $addFields: {
            _id: "$bonus._id",
            currency: user.currency,
            coef: "$bonus.coef_params.coef",
            will_finish: "$bonus.will_finish",
          },
        },
        {
          $project: {
            bonus: 0,
            promo: 0,
          },
        },
      ]);
    }

    const bonuses = [...userPromos, ...userBonuses];
    return bonuses;
  }

  async getPromo(authPayload: IAuthPayload, id: string) {
    const user = await this.userModel.findById(authPayload.id);

    const promo = await this.promoModel.findById(id, ["type", "will_finish", "coef", "amount", "currency"]);

    const amount = await this.convertService.convert(promo.currency, user.currency, promo.amount);

    promo.amount = amount;
    promo.currency = user.currency;

    return promo;
  }

  async findRecommendedRequisites(userPayload: IAuthPayload, dto: RequisiteDto) {
    const user = await this.userModel.findById(userPayload.id);
    // const usdBalance = this.convertService.convert(user.currency, "USD", user.balance);
    if (dto.type === RequisiteTypeEnum.REPLENISHMENT) {
      let recommendedRequisites = await this.accountModel
        .aggregate()
        .match({
          balance: {
            $gt: 0,
          },
          requisites: {
            $exists: true,
            $ne: [],
          },
        })
        .lookup({ from: "requisites", localField: "requisite", foreignField: "_id", as: "requisite" })
        .unwind("requisite")
        .lookup({ from: "accountrequisites", localField: "requisites", foreignField: "_id", as: "requisites" })
        .unwind("requisites")
        .match({
          "requisite.replenishment": true,
          "requisite.currency": user.currency,
          "requisite.active": true,
          "requisite.profile": true,
          "requisites.active": true,
        })
        .group({ _id: "$requisite._id", requisites: { $addToSet: "$requisite" } })
        .unwind("$requisites")
        .replaceRoot("$requisites");

      const requisites = await this.requisiteModel.find({ active: true, currency: user.currency, replenishment: true, $or: [{ AAIO: true }, { donatePay: true }] });
      const unique = _.unionBy(requisites, recommendedRequisites, r => r._id.toString());

      return unique;
    }

    let recommendedRequisites = await this.requisiteModel.find({ active: true, withdrawal: true, currency: user.currency });

    return recommendedRequisites;
  }

  async findRequisites(userPayload: IAuthPayload, dto: RequisiteDto) {
    if (dto.type === RequisiteTypeEnum.REPLENISHMENT) {
      let recommendedRequisites = await this.accountModel
        .aggregate()
        .match({
          balance: {
            $gt: 0,
          },
          requisites: {
            $exists: true,
            $ne: [],
          },
        })
        .lookup({ from: "requisites", localField: "requisite", foreignField: "_id", as: "requisite" })
        .unwind("requisite")
        .lookup({ from: "accountrequisites", localField: "requisites", foreignField: "_id", as: "requisites" })
        .unwind("requisites")
        .match({
          "requisite.replenishment": true,
          "requisite.active": true,
          "requisite.profile": true,
          "requisites.active": true,
        })
        .group({ _id: "$requisite._id", requisites: { $addToSet: "$requisite" } })
        .unwind("$requisites")
        .replaceRoot("$requisites");

      const requisites = await this.requisiteModel.find({ active: true, replenishment: true, $or: [{ AAIO: true }, { donatePay: true }] });

      const unique = _.unionBy(requisites, recommendedRequisites, r => r._id.toString());
      const group = _.chain(unique)
        .groupBy("currency")
        .map((value, key) => ({ currency: key, requisites: value }))
        .value();

      return group;
    }

    const requisites = await this.requisiteModel
      .aggregate()
      .match({ active: true, withdrawal: true })
      .group({ _id: "$currency", requisites: { $push: "$$ROOT" } })
      .addFields({ currency: "$_id" })
      .project({ _id: 0 });

    return requisites;
  }

  async updateProfileImage(userPayload: IAuthPayload, origin: string, imagePath: string) {
    const user = await this.userModel.findById(userPayload.id);
    const profileImage = url.parse(user.profileImage)?.pathname;

    const profileImagePath = path.normalize(process.cwd() + profileImage);

    if (profileImage) {
      fs.rmSync(profileImagePath, { recursive: true });
    }

    user.profileImage = new URL(imagePath, origin).toString();

    await user.save();

    return user.profileImage;
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleCron() {
    console.log("After 1 minute");

    const { currencies } = await this.adminModel.findOne();
    const currencyPercentageRanges: CurrencyPercentageRangesType = {};

    for (const currency of currencies) {
      currencyPercentageRanges[currency] = [];
    }

    for (const currency of currencies) {
      currencyPercentageRanges[currency].push({ min: 0, max: await this.convertService.convert("USD", currency, 5), percentage: 0.4 });
      currencyPercentageRanges[currency].push({
        min: await this.convertService.convert("USD", currency, 6),
        max: await this.convertService.convert("USD", currency, 10.99),
        percentage: 0.35,
      });
      currencyPercentageRanges[currency].push({
        min: await this.convertService.convert("USD", currency, 11),
        max: await this.convertService.convert("USD", currency, 20.99),
        percentage: 0.3,
      });
      currencyPercentageRanges[currency].push({
        min: await this.convertService.convert("USD", currency, 21),
        max: await this.convertService.convert("USD", currency, 40.99),
        percentage: 0.25,
      });
      currencyPercentageRanges[currency].push({
        min: await this.convertService.convert("USD", currency, 41),
        max: await this.convertService.convert("USD", currency, 100.99),
        percentage: 0.2,
      });
      currencyPercentageRanges[currency].push({
        min: await this.convertService.convert("USD", currency, 101),
        max: Infinity,
        percentage: 0.25,
      });
    }

    const users = await this.userModel.find({ descendants: { $ne: [] } });

    for (const user of users) {
      let totalReferralBalance = 0;
      for (let descendant of user.descendants) {
        const descendantUser = await this.userModel.findById(descendant._id);

        let calculatedReferralBalance = descendantUser.startBalance + descendantUser.sumReplenishment - (descendantUser.balance + descendantUser.sumWithdrawal);

        descendantUser.sumWithdrawal = 0;
        descendantUser.sumReplenishment = 0;
        descendantUser.startBalance = descendantUser.balance;

        if (calculatedReferralBalance <= 0) {
          await descendantUser.save();
          continue;
        }

        const range = currencyPercentageRanges[descendantUser.currency].find(range => calculatedReferralBalance >= range.min && calculatedReferralBalance <= range.max);

        calculatedReferralBalance = calculatedReferralBalance * range.percentage;

        user.balance += calculatedReferralBalance;

        descendant.earnings += calculatedReferralBalance;
        totalReferralBalance += calculatedReferralBalance;

        await descendantUser.save();
      }

      user.referralBalance += totalReferralBalance;

      if (totalReferralBalance > 0) {
        await this.referralModel.create({ user: user._id, createdAt: new Date(), currency: user.currency, earned: totalReferralBalance });
      }

      await user.save();
    }
  }
}
