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
import { CronExpression, SchedulerRegistry } from "@nestjs/schedule";
import { Account } from "src/admin/schemas/account.schema";
import { RequisiteDto, RequisiteTypeEnum } from "./dto/requisite.dto";

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
    const descendants = user?.descendants?.sort((a, b) => b.earnings - a.earnings);
    return { ...user.toJSON(), descendants };
  }

  async findReferralsByDay(auth: IAuthPayload, query: FindReferralsByDayDto) {
    const referrals = await this.referralModel.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(auth.id) } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" },
          },
          totalEarned: { $sum: "$earned" },
        },
      },
      { $skip: query.skip },
      { $limit: query.limit },
      {
        $addFields: {
          date: {
            $dateFromParts: {
              year: "$_id.year",
              month: "$_id.month",
              day: "$_id.day",
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
        },
      },
    ]);

    return referrals;
  }

  async confirmEmailSendCode(userPayload: IAuthPayload) {
    const user = await this.userModel.findById(userPayload.id);
    if (user.isEmailUpdated) {
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

    if (user.isEmailUpdated) {
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
      user.isEmailUpdated = true;
      user.codeToken = "";

      await user.save();

      const job = new CronJob("* * */2 * *", async () => {
        console.log("Time out");
        user.isEmailUpdated = false;

        await user.save();
      });

      this.schedulerRegistry.addCronJob(user._id.toString(), job);
      job.start();

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

    const promo = await this.promoModel.findOne({ name: dto.promoCode }, ["type", "will_finish", "coef", "amount", "currency", "limit"]);

    if (!promo) {
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

    return promo;
  }

  async getPromos(dto: GetPromosDto, userPayload: IAuthPayload) {
    const user = await this.userModel.findById(userPayload.id);

    const promos = await this.userPromoModel.aggregate([
      { $match: { user: user._id, active: false } },
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
    ]);

    return promos.map(entry => entry.promo);
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
      dto.type = RequisiteTypeEnum.PROFILE;
    }

    let recommendedRequisites = await this.accountModel
      .aggregate()
      .match({
        // balance: {
        //   $gte: usdBalance,
        //   $lte: usdBalance,
        // },
        requisites: {
          $exists: true,
          $ne: [],
        },
      })
      .lookup({ from: "requisites", localField: "requisite", foreignField: "_id", as: "requisite" })
      .unwind("requisite")
      .match({
        "requisite.currency": user.currency,
        "requisite.active": true,
        $or: [{ [`requisite.${dto.type}`]: true }, { "requisite.donatePay": true }, { "requisite.AAIO": true }],
      })
      .group({ _id: "$requisite._id", requisites: { $addToSet: "$requisite" } })
      .unwind("$requisites")
      .replaceRoot("$requisites");

    if (!recommendedRequisites.length && dto.type == RequisiteTypeEnum.PROFILE) {
      recommendedRequisites = await this.requisiteModel
        .aggregate()
        .match({ currency: user.currency, active: true, $or: [{ [`requisite.${dto.type}`]: true }, { "requisite.donatePay": true }, { "requisite.AAIO": true }] });
    }

    return recommendedRequisites;
  }

  async findRequisites(userPayload: IAuthPayload, dto: RequisiteDto) {
    const user = await this.userModel.findById(userPayload.id);

    if (dto.type === RequisiteTypeEnum.REPLENISHMENT) {
      dto.type = RequisiteTypeEnum.PROFILE;
    }

    let requisites = await this.accountModel
      .aggregate()
      .match({
        requisites: {
          $exists: true,
          $ne: [],
        },
      })
      .lookup({ from: "requisites", localField: "requisite", foreignField: "_id", as: "requisite" })
      .unwind("requisite")
      .match({
        "requisite.active": true,
        [`requisite.${dto.type}`]: { $eq: true },
        $or: [{ "requisite.profile": true }, { "requisite.donatePay": true }, { "requisite.AAIO": true }],
      })
      .group({ _id: "$requisite.currency", requisites: { $addToSet: "$requisite" } })
      .addFields({ currency: "$_id" })
      .project({ _id: 0 });

    if (!requisites.length && dto.type == RequisiteTypeEnum.PROFILE) {
      requisites = await this.requisiteModel
        .aggregate()
        .match({ active: true, $or: [{ [`requisite.${dto.type}`]: true }, { "requisite.donatePay": true }, { "requisite.AAIO": true }] })
        .group({ _id: "$requisite.currency", requisites: { $addToSet: "$$ROOT" } })
        .addFields({ currency: "$_id" })
        .project({ _id: 0 });
    }

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
}
