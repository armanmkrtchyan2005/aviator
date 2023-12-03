import { Module } from "@nestjs/common";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";
import { MongooseModule } from "@nestjs/mongoose";
import { User, UserSchema } from "./schemas/user.schema";
import { Bet, BetSchema } from "../bets/schemas/bet.schema";
import { ConvertModule } from "src/convert/convert.module";
import { MailModule } from "src/mail/mail.module";
import { Bonus, BonusSchema } from "./schemas/bonus.schema";

@Module({
  imports: [
    ConvertModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Bonus.name, schema: BonusSchema },
    ]),
    MailModule,
    ConvertModule,
  ],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
