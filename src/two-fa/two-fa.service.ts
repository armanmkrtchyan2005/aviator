import { JwtPayload } from "jsonwebtoken";
import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import { IAuthPayload } from "src/auth/auth.guard";
import { InjectModel } from "@nestjs/mongoose";
import { User } from "src/user/schemas/user.schema";
import { Model } from "mongoose";
import { generateCode } from "src/admin/common/utils/generate-code";
import { JwtService } from "@nestjs/jwt";
import { MailService } from "src/mail/mail.service";
import { ConfirmTwoFACodeDto } from "./dto/confirm-two-fa-code.dto";

interface ITwoFAPayload extends JwtPayload {
  code: number;
  twoFA: boolean;
}

@Injectable()
export class TwoFaService {
  constructor(@InjectModel(User.name) private userModel: Model<User>, private jwtService: JwtService, private mailService: MailService) {}

  async twoFAOn(authPayload: IAuthPayload) {
    const user = await this.userModel.findById(authPayload.id);

    if (!user) {
      throw new UnauthorizedException();
    }

    if (!user.email) {
      throw new BadRequestException("Для подключения функции привяжите Email");
    }

    if (user.twoFA) {
      throw new BadRequestException("Это функция уже была подключена");
    }

    const code = generateCode();

    await this.mailService.send2FASetCode({ email: user.email, login: user.login, message: "Ваш код для включения двухфакторной аутентификации в Aviator", code });

    const twoFAtoken = this.jwtService.sign({ code, twoFA: true });

    user.twoFAToken = twoFAtoken;

    await user.save();

    return { message: "На ваш Email отправлен код" };
  }

  async twoFAOff(authPayload: IAuthPayload) {
    const user = await this.userModel.findById(authPayload.id);

    if (!user) {
      throw new UnauthorizedException();
    }

    if (!user.twoFA) {
      throw new BadRequestException("Это функция уже была отключена");
    }

    const code = generateCode();

    await this.mailService.send2FASetCode({ email: user.email, login: user.login, message: "Ваш код для отключения двухфакторной аутентификации в Aviator", code });

    const twoFAtoken = this.jwtService.sign({ code, twoFA: false }, { expiresIn: process.env.TWO_FA_TOKEN_EXPIRATION });

    user.twoFAToken = twoFAtoken;

    await user.save();

    return { message: "На ваш Email отправлен код" };
  }

  async confirmSetTwoFACode(authPayload: IAuthPayload, dto: ConfirmTwoFACodeDto) {
    const user = await this.userModel.findById(authPayload.id);

    if (!user) {
      throw new UnauthorizedException();
    }

    if (!user.twoFAToken) {
      throw new BadRequestException("Неверный код");
    }

    try {
      const twoFAPayload = this.jwtService.verify<ITwoFAPayload>(user.twoFAToken);

      if (twoFAPayload.code !== dto.code) {
        throw new BadRequestException("Неверный код");
      }

      user.twoFA = twoFAPayload.twoFA;
      user.twoFAToken = "";

      await user.save();

      if (!user.twoFA) {
        return {
          message: "Двойная проверка успешно отключена",
        };
      }

      return {
        message: "Двойная проверка успешно подключена",
      };
    } catch (error) {
      throw new BadRequestException("Неверный код");
    }
  }
}
