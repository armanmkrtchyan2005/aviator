import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtModule } from "@nestjs/jwt";
import { MongooseModule } from "@nestjs/mongoose";
import { User, UserSchema } from "src/user/schemas/user.schema";
import { MailModule } from "src/mail/mail.module";
import { ConvertModule } from "src/convert/convert.module";
import { Bonus, BonusSchema } from "src/user/schemas/bonus.schema";
import { Promo, PromoSchema } from "src/user/schemas/promo.schema";
import { UserPromo, UserPromoSchema } from "src/user/schemas/userPromo.schema";
import { Session, SessionSchema } from "src/user/schemas/session.schema";

@Module({
  imports: [
    JwtModule.registerAsync({
      global: true,
      useFactory() {
        return {
          secret: process.env.JWT_SECRET,
          signOptions: {
            expiresIn: "1w",
          },
        };
      },
    }),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Bonus.name, schema: BonusSchema },
      { name: Promo.name, schema: PromoSchema },
      { name: UserPromo.name, schema: UserPromoSchema },
      { name: Session.name, schema: SessionSchema },
    ]),
    MailModule,
    ConvertModule,
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
