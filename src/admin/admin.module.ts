import { Module } from "@nestjs/common";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";
import { MongooseModule } from "@nestjs/mongoose";
import { Admin, AdminSchema } from "./schemas/admin.schema";
import { User, UserSchema } from "src/user/schemas/user.schema";
import { Requisite, RequisiteSchema } from "./schemas/requisite.schema";
import { Replenishment, ReplenishmentSchema } from "src/replenishment/schemas/replenishment.schema";
import { ConvertModule } from "src/convert/convert.module";
import { Withdrawal, WithdrawalSchema } from "src/withdrawal/schemas/withdrawal.schema";
import { Account, AccountSchema } from "./schemas/account.schema";
import { AccountRequisite, AccountRequisiteSchema } from "./schemas/account-requisite.schema";
import { SocketModule } from "src/socket/socket.module";
import { UserPromo, UserPromoSchema } from "src/user/schemas/userPromo.schema";
import { Bonus, BonusSchema } from "src/user/schemas/bonus.schema";

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
    ]),
    ConvertModule,
    SocketModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
