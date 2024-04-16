import { Module } from "@nestjs/common";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";
import { MongooseModule } from "@nestjs/mongoose";
import { User, UserSchema } from "./schemas/user.schema";
import { ConvertModule } from "src/convert/convert.module";
import { MailModule } from "src/mail/mail.module";
import { Requisite, RequisiteSchema } from "src/admin/schemas/requisite.schema";
import { Admin, AdminSchema } from "src/admin/schemas/admin.schema";
import { Referral, ReferralSchema } from "./schemas/referral.schema";
import { Promo, PromoSchema } from "./schemas/promo.schema";
import { UserPromo, UserPromoSchema } from "./schemas/userPromo.schema";
import { Session, SessionSchema } from "./schemas/session.schema";
import { Account, AccountSchema } from "src/admin/schemas/account.schema";

@Module({
  imports: [
    ConvertModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Promo.name, schema: PromoSchema },
      { name: UserPromo.name, schema: UserPromoSchema },
      { name: Requisite.name, schema: RequisiteSchema },
      { name: Admin.name, schema: AdminSchema },
      { name: Referral.name, schema: ReferralSchema },
      { name: Session.name, schema: SessionSchema },
      { name: Account.name, schema: AccountSchema },
    ]),
    MailModule,
  ],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
