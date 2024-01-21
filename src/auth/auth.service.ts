import * as bcrypt from "bcrypt";
import { ConvertService } from "./../convert/convert.service";
import { BadRequestException, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { User } from "src/user/schemas/user.schema";
import { SignUpDto } from "./dto/sign-up.dto";
import { SignInDto } from "./dto/sign-in.dto";
import { MailService } from "src/mail/mail.service";
import { SendCodeDto } from "./dto/send-code.dto";
import { ConfirmCodeDto } from "./dto/confirm-code.dto";
import { SignUpCreatedResponse } from "./responses/sign-up.response";
import { SignInOkResponse } from "./responses/sign-in.response";
import { SendCodeOkResponse } from "./responses/send-code.response";
import { ConfirmCodeOkResponse } from "./responses/confirm-code.response";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { ChangePasswordOkResponse } from "./responses/change-password.response";

const saltRounds = 10;
export const salt = bcrypt.genSaltSync(saltRounds);

export const generateCode = () => {
  return Math.floor(100000 + Math.random() * 900000);
};

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService, @InjectModel(User.name) private userModel: Model<User>, private mailService: MailService, private convertService: ConvertService) {}

  async signUp(dto: SignUpDto): Promise<SignUpCreatedResponse> {
    const userEmail = await this.userModel.findOne({
      email: dto.email,
    });

    const userLogin = await this.userModel.findOne({
      login: dto.login,
    });

    const errors = [];

    if (userEmail) {
      errors.push("Данный email уже зарегистрирован");
    }

    if (userLogin) {
      errors.push("Данный логин уже зарегистрирован");
    }

    if (errors.length > 0) {
      throw new BadRequestException(errors);
    }

    const balance = await this.convertService.convert("USD", dto.currency, 1);

    const hashedPassword = bcrypt.hashSync(dto.password, salt);

    const leader = await this.userModel.findOne({ login: dto.from });

    const newUser = await this.userModel.create({ ...dto, balance, password: hashedPassword, leader });

    if (leader) {
      leader.descendants.push({ _id: newUser._id.toString(), createdAt: new Date(), updatedUt: new Date(), earnings: 0 });

      await leader.save();
    }

    const token = this.jwtService.sign({ id: newUser._id }, {});

    return {
      token,
    };
  }

  async signIn(dto: SignInDto): Promise<SignInOkResponse> {
    const user = await this.userModel.findOne({
      login: dto.login,
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

  async sendCode(dto: SendCodeDto, session: Record<string, any>): Promise<SendCodeOkResponse> {
    session.codeToken = "";

    const user = await this.userModel.findOne({
      email: dto.email,
    });

    if (!user) {
      throw new BadRequestException("Такой пользователь не найден");
    }

    const code = generateCode();

    const token = this.jwtService.sign({ id: user._id, code }, { expiresIn: 60 * 60 * 2 });

    await this.mailService.sendUserForgotCode(dto.email, code);

    session.codeToken = token;

    return { message: "На ваш Email отправлен код для подтверждения" };
  }

  async confirmCode(dto: ConfirmCodeDto, session: Record<string, any>): Promise<ConfirmCodeOkResponse> {
    if (!session.codeToken) {
      throw new BadRequestException("Неверный код");
    }

    try {
      const payload = await this.jwtService.verifyAsync(session.codeToken);

      if (payload?.code !== dto.code) {
        throw new BadRequestException("Неверный код");
      }

      session.codeToken = "";

      const token = await this.jwtService.signAsync({ id: payload.id }, { expiresIn: 60 * 60 * 10 });

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
