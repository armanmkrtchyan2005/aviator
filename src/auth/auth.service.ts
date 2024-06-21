import * as bcrypt from "bcrypt";
import { ConvertService } from "./../convert/convert.service";
import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { User } from "src/user/schemas/user.schema";
import { SignUpDto } from "./dto/sign-up.dto";
import { SignInDto } from "./dto/sign-in.dto";
import { MailService, SendEmailType } from "src/mail/mail.service";
import { SendCodeDto } from "./dto/send-code.dto";
import { ConfirmCodeDto } from "./dto/confirm-code.dto";
import { SignUpCreatedResponse } from "./responses/sign-up.response";
import { SendCodeOkResponse } from "./responses/send-code.response";
import { ConfirmCodeOkResponse } from "./responses/confirm-code.response";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { ChangePasswordOkResponse } from "./responses/change-password.response";
import { Bonus, CoefParamsType } from "src/user/schemas/bonus.schema";
import * as _ from "lodash";
import { Promo, PromoType } from "src/user/schemas/promo.schema";
import { UserPromo } from "src/user/schemas/userPromo.schema";
import { generateCode } from "src/admin/common/utils/generate-code";
import { SignInVerifyDto } from "./dto/sign-in-verify.dto";
import { Session } from "src/user/schemas/session.schema";
import { SignOutDto } from "./dto/sign-out.dto";
import { Request } from "express";
import { SignUpConfirmDto } from "./dto/sign-up-confirm.dto";
import { HOURS48 } from "src/constants";
import { IdentityCounter } from "src/admin/schemas/identity-counter.schema";

const saltRounds = 10;
export const salt = bcrypt.genSaltSync(saltRounds);

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Bonus.name) private bonusModel: Model<Bonus>,
    @InjectModel(Promo.name) private promoModel: Model<Promo>,
    @InjectModel(UserPromo.name) private userPromoModel: Model<UserPromo>,
    @InjectModel(Session.name) private sessionModel: Model<Session>,
    @InjectModel(IdentityCounter.name) private identityCounterModel: Model<IdentityCounter>,
    private mailService: MailService,
    private convertService: ConvertService,
  ) {}

  async signUp(dto: SignUpDto, isEmailConfirmed?: boolean): Promise<SignUpCreatedResponse> {
    const userEmail = await this.userModel.findOne({
      email: dto.email,
    });

    const userLogin = await this.userModel.findOne({
      login: dto.login,
    });

    const promo = await this.promoModel.findOne({ name: dto.promocode, to_user_id: null, active: true });

    if (dto.email && userEmail) {
      throw new BadRequestException("Невозможно привязать данный Email");
    }

    if (userLogin) {
      throw new BadRequestException("Невозможно зарегистрироваться с данным логином. Попробуйте другой логин.");
    }

    if (dto.email && !isEmailConfirmed) {
      const code = generateCode();

      const token = this.jwtService.sign({ code, email: dto.email }, { expiresIn: 60 * 60 * 2 });

      await this.mailService.sendUserForgotCode({ code, email: dto.email, type: SendEmailType.REGISTRATION });

      return {
        isEmailToken: true,
        token,
      };
    }

    if (dto.promocode && !promo) {
      throw new BadRequestException("Промокод не найден");
    }

    const newUsersBonuses = await this.bonusModel.find({ active: true, "coef_params.type": CoefParamsType.NEW_USERS });

    const hashedPassword = bcrypt.hashSync(dto.password, salt);

    const leader = await this.userModel.findOne({ uid: dto.from });

    const newUser = new this.userModel({ ...dto, password: hashedPassword });

    if (dto.email) {
      newUser.emailUpdatedAt = new Date();
    }

    if (leader) {
      const isUserFined = await this.userModel.findOne({ telegramId: dto.telegramId });

      if (!isUserFined) {
        const { count } = await this.identityCounterModel.findOne({ model: "User" });
        leader.descendants.push({ _id: newUser._id.toString(), uid: count + 1, telegramId: newUser.telegramId, createdAt: new Date(), updatedUt: new Date(), earnings: 0 });
        newUser.leader = leader;
        await leader.save();
      }
    }

    for (let newUsersBonus of newUsersBonuses) {
      const randomAmount = _.random(newUsersBonus.coef_params.amount_first, newUsersBonus.coef_params.amount_second);
      const amount = await this.convertService.convert("USD", dto.currency, randomAmount);
      await this.userPromoModel.create({ active: false, user: newUser._id, bonus: newUsersBonus._id, amount });
    }

    await newUser.save();

    if (promo) {
      const newUserPromo = await this.userPromoModel.create({ user: newUser._id, promo: promo._id });

      if (promo.type === PromoType.PROMO) {
        newUserPromo.amount = await this.convertService.convert(promo.currency, newUser.currency, promo.amount);
      }

      if (promo.type === PromoType.ADD_BALANCE) {
        newUserPromo.limit = await this.convertService.convert(promo.currency, newUser.currency, promo.limit);
      }

      await newUserPromo.save();

      promo.used_count++;

      await promo.save();
    }

    const token = this.jwtService.sign({ id: newUser._id }, {});

    await this.sessionModel.create({ token, user: newUser._id });

    return {
      isEmailToken: false,
      token,
    };
  }

  async signUpConfirm(dto: SignUpConfirmDto): Promise<SignUpCreatedResponse> {
    const payload: { code: number; email: string } = this.jwtService.verify(dto.token);

    if (dto.email !== payload.email) {
      throw new BadRequestException("Неверный код");
    }

    if (dto.code !== payload.code) {
      throw new BadRequestException("Неверный код");
    }

    return await this.signUp(dto, true);
  }

  async signIn(dto: SignInDto) {
    const user = await this.userModel.findOne({
      $or: [{ login: dto.login }, { email: dto.login }],
    });

    if (!user) {
      throw new BadRequestException("Неверный логин или пароль!");
    }

    const isPasswordRight = bcrypt.compareSync(dto.password, user.password);

    if (!isPasswordRight) {
      throw new BadRequestException("Неверный логин или пароль!");
    }

    if (user.twoFA) {
      const code = generateCode();

      await this.mailService.send2FACode({ email: user.email, login: user.login, code });

      const twoFAtoken = this.jwtService.sign({ id: user._id, code }, { expiresIn: process.env.TWO_FA_TOKEN_EXPIRATION });

      user.twoFAToken = twoFAtoken;

      await user.save();

      return { twoFactorEnabled: true, message: "На ваш Email отправлен код" };
    }

    await user.save();

    const token = this.jwtService.sign({ id: user._id }, {});

    await this.sessionModel.create({ token, user: user._id });

    return { twoFactorEnabled: false, token, message: "Токен для авторизации" };
  }

  async signInVerify(dto: SignInVerifyDto) {
    const user = await this.userModel.findOne({ $or: [{ login: dto.login }, { email: dto.login }] });
    if (!user) {
      throw new BadRequestException("Неверный код");
    }

    if (!user.twoFAToken) {
      throw new BadRequestException("Неверный код");
    }

    try {
      const twoFAPayload = this.jwtService.verify(user.twoFAToken);

      if (twoFAPayload.code !== dto.code) {
        throw new BadRequestException("Неверный код");
      }

      const token = this.jwtService.sign({ id: user._id }, {});

      await this.sessionModel.create({ token, user: user._id });

      user.twoFAToken = "";

      await user.save();
      return { token };
    } catch (error) {
      throw new BadRequestException("Неверный код");
    }
  }

  async signOut(dto: SignOutDto) {
    await this.sessionModel.findOneAndDelete({ token: dto.token });

    return {
      message: "Вы вышли из системы",
    };
  }

  async sendCode(req: Request, dto: SendCodeDto): Promise<SendCodeOkResponse> {
    const token = req.headers.authorization?.split(" ")[1];

    const session = await this.sessionModel.findOne({ token });

    const user = await this.userModel.findOne({
      email: dto.email,
    });

    if (!user) {
      throw new BadRequestException("Такой пользователь не найден");
    }

    let type = SendEmailType.FORGOT;

    if (user._id.toString() == session?.user?.toString()) {
      type = SendEmailType.RESET;
    }

    const now = new Date();

    if (user.emailUpdatedAt && now.getTime() - user.emailUpdatedAt.getTime() <= HOURS48) {
      throw new BadRequestException("Невозможно выполнить действие. Попробуйте позже.");
    }

    const code = generateCode();

    user.codeToken = this.jwtService.sign({ code }, { expiresIn: 60 * 60 * 2 });

    await this.mailService.sendUserForgotCode({ code, email: dto.email, login: user.login, type });

    await user.save();

    return { message: "На ваш Email отправлен код для подтверждения" };
  }

  async confirmCode(dto: ConfirmCodeDto): Promise<ConfirmCodeOkResponse> {
    try {
      const user = await this.userModel.findOne({ email: dto.email });

      const payload: { code: number } = await this.jwtService.verifyAsync(user.codeToken);

      if (payload?.code !== dto.code) {
        throw new BadRequestException("Неверный код");
      }

      const token = await this.jwtService.signAsync({ id: user._id }, { expiresIn: 60 * 60 * 10 });

      user.codeToken = null;

      await user.save();

      return { token };
    } catch (error) {
      throw new BadRequestException("Неверный код");
    }
  }

  async changePassword(dto: ChangePasswordDto, token: string): Promise<ChangePasswordOkResponse> {
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
}
