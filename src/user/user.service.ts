import * as bcrypt from "bcrypt";
import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { User } from "./schemas/user.schema";
import { Model } from "mongoose";
import { IAuthPayload } from "src/auth/auth.guard";
import { generateCode, salt } from "src/auth/auth.service";
import { SendCodeDto } from "src/auth/dto/send-code.dto";
import { ConfirmCodeDto } from "src/auth/dto/confirm-code.dto";
import { JwtService } from "@nestjs/jwt";
import { MailService } from "src/mail/mail.service";
import { OldPasswordConfirmDto } from "./dto/old-password-confirm.dto";
import { ChangePasswordDto } from "src/auth/dto/change-password.dto";
import { Bonus } from "./schemas/bonus.schema";
import { AddBonusDto } from "./dto/add-bonus.dto";
import { ConvertService } from "src/convert/convert.service";
import { Requisite, RequisiteStatusEnum } from "src/admin/schemas/requisite.schema";
import { Admin } from "src/admin/schemas/admin.schema";

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Bonus.name) private bonusModel: Model<Bonus>,
    @InjectModel(Requisite.name) private requisiteModel: Model<Requisite>,
    @InjectModel(Admin.name) private adminModel: Model<Admin>,
    private jwtService: JwtService,
    private mailService: MailService,
    private convertService: ConvertService,
  ) {}

  async findMe(auth: IAuthPayload) {
    const user = await this.userModel.findById(auth.id, { telegramId: true, login: true, referralBalance: true, descendants: true, email: true });

    return user;
  }

  async myBalance(auth: IAuthPayload) {
    const user = await this.userModel.findById(auth.id, ["balance", "currency"]);

    return user;
  }

  async confirmEmailSendCode(session: Record<string, any>, userPayload: IAuthPayload) {
    session.codeToken = "";
    const user = await this.userModel.findById(userPayload.id);

    const code = generateCode();

    const token = this.jwtService.sign({ id: user._id, code }, { expiresIn: 60 * 60 * 2 });

    await this.mailService.sendUserForgotCode(user.email, code);

    session.codeToken = token;

    return { message: "На ваш Email отправлен код для подтверждения" };
  }

  async confirmEmailConfirmCode(dto: ConfirmCodeDto, session: Record<string, any>) {
    if (!session.codeToken) {
      throw new BadRequestException("Неверный код");
    }

    try {
      const payload = await this.jwtService.verifyAsync(session.codeToken);

      if (payload?.code !== dto.code) {
        throw new BadRequestException("Неверный код");
      }

      session.codeToken = "";

      const user = await this.userModel.findById(payload.id);
      user.email = payload.email;

      await user.save();

      return { message: "Ваш email подтверждён" };
    } catch (error) {
      throw new BadRequestException("Неверный код");
    }
  }

  async changeEmailSendCode(dto: SendCodeDto, session: Record<string, any>, userPayload: IAuthPayload) {
    session.codeToken = "";

    const userFromEmail = await this.userModel.findOne({
      email: dto.email,
    });

    if (userFromEmail) {
      throw new BadRequestException("Такой пользователь уже существует");
    }

    const user = await this.userModel.findById(userPayload.id);

    const code = generateCode();

    const token = this.jwtService.sign({ id: user._id, code, email: dto.email }, { expiresIn: 60 * 60 * 2 });

    await this.mailService.sendUserForgotCode(dto.email, code);

    session.codeToken = token;

    return { message: "На ваш Email отправлен код для подтверждения" };
  }

  async changeEmailConfirmCode(dto: ConfirmCodeDto, session: Record<string, any>) {
    if (!session.codeToken) {
      throw new BadRequestException("Неверный код");
    }

    try {
      const payload = await this.jwtService.verifyAsync(session.codeToken);

      if (payload?.code !== dto.code) {
        throw new BadRequestException("Неверный код");
      }

      session.codeToken = "";

      const user = await this.userModel.findById(payload.id);
      user.email = payload.email;

      await user.save();

      return { message: "ваш email успешно изменен" };
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

      return {
        message: "Ваш пароль успешно изменен",
      };
    } catch (error) {
      throw new BadRequestException("Неправильные данные");
    }
  }

  async addBonus(dto: AddBonusDto, userPayload: IAuthPayload) {
    const bonus = await this.bonusModel.findOne({ promoCode: dto.promoCode });

    if (!bonus) {
      throw new BadRequestException("Нет такого промокода");
    }

    if (bonus.usedCount >= bonus.maxUsedCount) {
      throw new BadRequestException("Нет такого промокода");
    }

    const user = await this.userModel.findById(userPayload.id);
    const isHavePromoCode = user.bonuses.some(b => {
      return b._id === bonus._id;
    });

    if (isHavePromoCode) {
      throw new BadRequestException("такой промокод у вас уже есть");
    }

    user.bonuses.push(bonus);
    await user.save();

    bonus.usedCount++;
    await bonus.save();

    return { message: "Промокод успешно активирован" };
  }

  async getBonuses(userPayload: IAuthPayload) {
    const user = await this.userModel.findById(userPayload.id, { bonuses: true }).populate("bonuses");

    return user.bonuses;
  }

  async getBonus(userPayload: IAuthPayload, id: string) {
    const user = await this.userModel.findById(userPayload.id);
    const bonus = await this.bonusModel.findById(id);

    if (!bonus) {
      throw new BadRequestException("Бонус не найден");
    }

    bonus.bonus = await this.convertService.convert(bonus.currency, user.currency, bonus.bonus);
    bonus.currency = user.currency;

    return bonus;
  }

  async findRecommendedRequisites(userPayload: IAuthPayload) {
    const user = await this.userModel.findById(userPayload.id);

    const recommendedRequisites = await this.requisiteModel.find({
      currency: user.currency,
      status: RequisiteStatusEnum.ACTIVE,
    });

    return recommendedRequisites;
  }

  async findRequisites() {
    const requisites = await this.requisiteModel.aggregate([
      {
        $match: {
          status: "Активный",
        },
      },
      {
        $group: {
          _id: "$currency",
          requisites: {
            $push: "$$CURRENT",
          },
        },
      },
      {
        $addFields: {
          currency: "$_id",
        },
      },
      {
        $project: {
          _id: 0,
        },
      },
    ]);

    return requisites;
  }
}
