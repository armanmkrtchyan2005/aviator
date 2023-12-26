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

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Admin.name, schema: AdminSchema },
      { name: User.name, schema: UserSchema },
      { name: Replenishment.name, schema: ReplenishmentSchema },
      { name: Requisite.name, schema: RequisiteSchema },
      { name: Withdrawal.name, schema: WithdrawalSchema },
    ]),
    ConvertModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
