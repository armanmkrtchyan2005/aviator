import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ConvertModule } from "src/convert/convert.module";
import { Replenishment, ReplenishmentSchema } from "src/replenishment/schemas/replenishment.schema";
import { SocketModule } from "src/socket/socket.module";
import { Bonus, BonusSchema } from "src/user/schemas/bonus.schema";
import { User, UserSchema } from "src/user/schemas/user.schema";
import { UserPromo, UserPromoSchema } from "src/user/schemas/userPromo.schema";
import { Withdrawal, WithdrawalSchema } from "src/withdrawal/schemas/withdrawal.schema";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";
import { AccountRequisite, AccountRequisiteSchema } from "./schemas/account-requisite.schema";
import { AccountSession, AccountSessionSchema } from "./schemas/account-session.schema";
import { Account, AccountSchema } from "./schemas/account.schema";
import { Admin, AdminSchema } from "./schemas/admin.schema";
import { Requisite, RequisiteSchema } from "./schemas/requisite.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Admin.name, schema: AdminSchema },
      { name: Account.name, schema: AccountSchema },
      { name: User.name, schema: UserSchema },
      { name: Replenishment.name, schema: ReplenishmentSchema },
      { name: Requisite.name, schema: RequisiteSchema },
      { name: AccountRequisite.name, schema: AccountRequisiteSchema },
      { name: Withdrawal.name, schema: WithdrawalSchema },
      { name: Bonus.name, schema: BonusSchema },
      { name: UserPromo.name, schema: UserPromoSchema },
      { name: AccountSession.name, schema: AccountSessionSchema },
    ]),
    ConvertModule,
    SocketModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
