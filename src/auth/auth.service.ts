import * as bcrypt from "bcrypt";
import { ConvertService } from "./../convert/convert.service";
import { BadRequestException, Injectable } from "@nestjs/common";
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
import { SignInOkResponse } from "./responses/sign-in.response";
import { SendCodeOkResponse } from "./responses/send-code.response";
import { ConfirmCodeOkResponse } from "./responses/confirm-code.response";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { ChangePasswordOkResponse } from "./responses/change-password.response";
import { Bonus, CoefParamsType } from "src/user/schemas/bonus.schema";
import * as _ from "lodash";
import { Promo, PromoType } from "src/user/schemas/promo.schema";
import { UserPromo } from "src/user/schemas/userPromo.schema";

const saltRounds = 10;
export const salt = bcrypt.genSaltSync(saltRounds);

export const generateCode = () => {
  return Math.floor(100000 + Math.random() * 900000);
};

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Bonus.name) private bonusModel: Model<Bonus>,
    @InjectModel(Promo.name) private promoModel: Model<Promo>,
    @InjectModel(UserPromo.name) private userPromoModel: Model<UserPromo>,
    private mailService: MailService,
    private convertService: ConvertService,
  ) {}

  async signUp(dto: SignUpDto): Promise<SignUpCreatedResponse> {
    const userEmail = await this.userModel.findOne({
      email: dto.email,
    });

    const userLogin = await this.userModel.findOne({
      login: dto.login,
    });

    const promo = await this.promoModel.findOne({ name: dto.promocode }, ["type", "will_finish", "coef", "amount", "currency", "limit"]);

    if (userEmail) {
      throw new BadRequestException("Данный email уже зарегистрирован");
    }

    if (userLogin) {
      throw new BadRequestException("Данный логин уже зарегистрирован");
    }

    if (dto.promocode && !promo) {
      throw new BadRequestException("Промокод не найден");
    }

    // if (dto.email) {
    //   const code = generateCode();

    //   // user.codeToken = this.jwtService.sign({ code }, { expiresIn: 60 * 60 * 2 });

    //   this.mailService.sendUserForgotCode({ code, email: dto.email, type: SendEmailType.REGISTRATION });

    //   return;
    // }

    const newUsersBonuses = await this.bonusModel.find({ active: true, coef_params: { type: CoefParamsType.NEW_USERS } });

    const hashedPassword = bcrypt.hashSync(dto.password, salt);

    const leader = await this.userModel.findOne({ login: dto.from });

    const newUser = await this.userModel.create({ ...dto, password: hashedPassword, leader });

    if (leader) {
      leader.descendants.push({ _id: newUser._id.toString(), createdAt: new Date(), updatedUt: new Date(), earnings: 0 });

      await leader.save();
    }

    let balance = 0;

    for (let newUsersBonus of newUsersBonuses) {
      const amount = _.random(newUsersBonus.coef_params.amount_first, newUsersBonus.coef_params.amount_second);
      balance += await this.convertService.convert("USD", dto.currency, amount);
      newUsersBonus.actived_users.push(newUser);
    }

    newUser.balance = balance;

    await newUser.save();
    if (promo) {
      const newUserPromo = await this.userPromoModel.create({ user: newUser._id, promo: promo?._id });

      if (promo.type === PromoType.ADD_BALANCE) {
        newUserPromo.limit = await this.convertService.convert(promo.currency, newUser.currency, promo.limit);

        await newUserPromo.save();
      }
    }

    const token = this.jwtService.sign({ id: newUser._id }, {});

    return {
      token,
    };
  }

  async signIn(dto: SignInDto): Promise<SignInOkResponse> {
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

    const token = this.jwtService.sign({ id: user._id }, {});

    return { token };
  }

  async sendCode(dto: SendCodeDto): Promise<SendCodeOkResponse> {
    const user = await this.userModel.findOne({
      email: dto.email,
    });

    if (!user) {
      throw new BadRequestException("Такой пользователь не найден");
    }

    const code = generateCode();

    user.codeToken = this.jwtService.sign({ code }, { expiresIn: 60 * 60 * 2 });

    await this.mailService.sendUserForgotCode({ code, email: dto.email, login: user.login, type: SendEmailType.FORGOT });

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
