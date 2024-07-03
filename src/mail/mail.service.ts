import { BadRequestException, Injectable } from "@nestjs/common";
import { MailerService } from "@nestjs-modules/mailer";
import { ConfirmEmailSendCodeType } from "src/user/dto/confirm-email-send-code.dto";

export enum SendEmailType {
  RESET = "reset",
  FORGOT = "forgot",
  REGISTRATION = "registration",
  CHANGE = "change",
  BINDING = "binding",
}

interface ISendEmail {
  email: string;
  code: number;
  login?: string;
}

interface ISendForgotEmail extends ISendEmail {
  type: SendEmailType | ConfirmEmailSendCodeType;
}

interface ISend2FAEmail extends ISendEmail {
  message: string;
}

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}

  async sendUserForgotCode(options: ISendForgotEmail) {
    let html: string;
    let subject: string;

    if (options.type === SendEmailType.REGISTRATION) {
      subject = "Регистрация в игре Aviator";
      html = `
      <p>Ваш код для регистрации в игре Aviator: <b>${options.code}</b></p>
      <br />
      <p>Никому не сообщайте!</p>
      `;
    }

    if (options.type === SendEmailType.CHANGE) {
      subject = "Код подтверждения Email";
      html = `
        <p>Никому не сообщайте код для изменения email в игре Aviator: <b>${options.code}</b></p>
        <br />
        Ваш логин: ${options.login}
        <br />
        <p>Если действие совершается не Вами, незамедлительно обратитесь в поддержку!</p>
      `;
    }

    if (options.type === SendEmailType.BINDING) {
      subject = "Код подтверждения Email";
      html = `
        <p>Никому не сообщайте код для привязки email в игре Aviator: <b>${options.code}</b></p>
        <br />
        <p>Ваш логин: <b>${options.login}</b></p>
        <p>Если действие совершается не Вами, незамедлительно обратитесь в поддержку!</p>
      `;
    }

    if (options.type === SendEmailType.FORGOT) {
      subject = "Восстановление пароля";
      html = `
        <p>Ваш код для восстановления пароля в игре Aviator: <b>${options.code}</b></p>
        <p>Никому не сообщайте!</p>
        <br />
        <p>Ваш логин: <b>${options.login}</b></p>
        <p>Если действие совершается не Вами, незамедлительно обратитесь в поддержку!</p>
      `;
    }

    if (options.type === SendEmailType.RESET) {
      subject = "Изменение пароля";
      html = `
        <p>Ваш код для изменения пароля в игре Aviator: <b>${options.code}</b></p>
        <p>Никому не сообщайте!</p>
        <br />
        <p>Ваш логин: <b>${options.login}</b></p>
        <p>Если действие совершается не Вами, незамедлительно обратитесь в поддержку!</p>
      `;
    }

    try {
      await this.mailerService.sendMail({
        to: options.email,
        subject,
        html,
      });
    } catch (error) {
      console.log(error);

      throw new BadRequestException("Ошибка отправки кода. Проверьте правильность ввода Email");
    }
  }

  async send2FASetCode(options: ISend2FAEmail) {
    const html = `
    <p>${options.message}: <b>${options.code}</b></p>
    <p>Никому не сообщайте!</p>
    <br />
    <p>Ваш логин: <b>${options.login}</b></p>
    <p>Если действие совершается не Вами, незамедлительно обратитесь в поддержку!</p>
  `;

    await this.mailerService.sendMail({
      to: options.email,
      subject: options.message,
      html,
    });
  }

  async send2FACode(options: ISendEmail) {
    const html = `
    <p>Код подтверждения двухфакторной аутентификации в Aviator: <b>${options.code}</b></p>
    <p>Никому не сообщайте!</p>
    <br />
    <p>Ваш логин: <b>${options.login}</b></p>
    <p>Если действие совершается не Вами, незамедлительно обратитесь в поддержку!</p>
  `;

    await this.mailerService.sendMail({
      to: options.email,
      subject: "Код подтверждения двухфакторной аутентификации",
      text: "Confirmation code",
      html,
    });
  }
}
