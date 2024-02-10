import { Injectable } from "@nestjs/common";
import { MailerService } from "@nestjs-modules/mailer";

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}

  async sendUserForgotCode(email: string, code: number, login: string) {
    await this.mailerService.sendMail({
      to: email,
      subject: "Password reset code",
      text: "Confirmation code",
      html: `
        <p>Ваш код для восстановления пароля в Aviator: <b>${code}</b></p>
        <p>Никому не сообщайте!</p>
        <br />
        <p>Ваш логин: <b>${login}</b></p>
      `,
    });
  }
}
