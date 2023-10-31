import { Injectable } from "@nestjs/common";
import { MailerService } from "@nestjs-modules/mailer";

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}

  async sendUserForgotCode(email: string, code: number) {
    await this.mailerService.sendMail({
      to: email,
      subject: "Password reset code",
      template: "/forgot-code",
      context: {
        code,
      },
    });
  }
}
