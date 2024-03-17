import { Module } from "@nestjs/common";
import { TwoFaService } from "./two-fa.service";
import { TwoFaController } from "./two-fa.controller";
import { MongooseModule } from "@nestjs/mongoose";
import { User, UserSchema } from "src/user/schemas/user.schema";
import { MailModule } from "src/mail/mail.module";
import { Session, SessionSchema } from "src/user/schemas/session.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Session.name, schema: SessionSchema },
    ]),
    MailModule,
  ],
  controllers: [TwoFaController],
  providers: [TwoFaService],
})
export class TwoFaModule {}
