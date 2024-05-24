import { Module } from "@nestjs/common";
import { ReplenishmentService } from "./replenishment.service";
import { ReplenishmentController } from "./replenishment.controller";
import { ConvertModule } from "src/convert/convert.module";
import { MongooseModule } from "@nestjs/mongoose";
import { User, UserSchema } from "src/user/schemas/user.schema";
import { Admin, AdminSchema } from "src/admin/schemas/admin.schema";
import { Replenishment, ReplenishmentSchema } from "./schemas/replenishment.schema";
import { Requisite, RequisiteSchema } from "src/admin/schemas/requisite.schema";
import { ScheduleModule } from "@nestjs/schedule";
import { UserPromo, UserPromoSchema } from "src/user/schemas/userPromo.schema";
import { Bonus, BonusSchema } from "src/user/schemas/bonus.schema";
import { Account, AccountSchema } from "src/admin/schemas/account.schema";
import { Session, SessionSchema } from "src/user/schemas/session.schema";
import { PaymentModule } from "src/payment/payment.module";
import { AccountRequisite, AccountRequisiteSchema } from "src/admin/schemas/account-requisite.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Admin.name, schema: AdminSchema },
      { name: User.name, schema: UserSchema },
      { name: Requisite.name, schema: RequisiteSchema },
      { name: Replenishment.name, schema: ReplenishmentSchema },
      { name: UserPromo.name, schema: UserPromoSchema },
      { name: Bonus.name, schema: BonusSchema },
      { name: Account.name, schema: AccountSchema },
      { name: AccountRequisite.name, schema: AccountRequisiteSchema },
      { name: Session.name, schema: SessionSchema },
    ]),
    ConvertModule,
    PaymentModule,
  ],
  controllers: [ReplenishmentController],
  providers: [ReplenishmentService],
})
export class ReplenishmentModule {}
