import { Injectable } from "@nestjs/common";
import { MailerService } from "@nestjs-modules/mailer";

export enum SendEmailType {
  FORGOT = "forgot",
  REGISTRATION = "registration",
  CHANGE = "change",
  BINDING = "binding",
}

interface ISendEmail {
  type: SendEmailType;
  email: string;
  code: number;
  login?: string;
}

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}

  async sendUserForgotCode(options: ISendEmail) {
    let html: string;
    if (options.type === SendEmailType.REGISTRATION) {
      html = `
      <p>Ваш код для регистрации в игре Aviator: <b>${options.code}</b></p>
      <br />
      <p>Никому не сообщайте!</p>
      `;
    }

    if (options.type === SendEmailType.CHANGE) {
      html = `
        <p>Никому не сообщайте код для изменения email в игре Aviator: <b>${options.code}</b></p>
        <br />
        Ваш логин: ${options.login}
        <br />
        <p>Если действие совершается не Вами, незамедлительно обратитесь в поддержку!</p>
      `;
    }

    if (options.type === SendEmailType.BINDING) {
      html = `
        <p>Никому не сообщайте код для привязки email в игре Aviator: <b>${options.code}</b></p>
        <br />
        <p>Ваш логин: <b>${options.login}</b></p>
        <p>Если действие совершается не Вами, незамедлительно обратитесь в поддержку!</p>
      `;
    }

    if (options.type === SendEmailType.FORGOT) {
      html = `
        <p>Ваш код для восстановления пароля в Aviator: <b>${options.code}</b></p>
        <p>Никому не сообщайте!</p>
        <br />
        <p>Ваш логин: <b>${options.login}</b></p>
        <p>Если действие совершается не Вами, незамедлительно обратитесь в поддержку!</p>
      `;
    }

    await this.mailerService.sendMail({
      to: options.email,
      subject: "Password reset code",
      text: "Confirmation code",
      html,
    });
  }
}
