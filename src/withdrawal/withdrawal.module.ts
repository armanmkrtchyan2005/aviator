import { Module } from "@nestjs/common";
import { WithdrawalController } from "./withdrawal.controller";
import { WithdrawalService } from "./withdrawal.service";
import { MongooseModule } from "@nestjs/mongoose";
import { User, UserSchema } from "src/user/schemas/user.schema";
import { Requisite, RequisiteSchema } from "src/admin/schemas/requisite.schema";
import { Withdrawal, WithdrawalSchema } from "./schemas/withdrawal.schema";
import { Admin, AdminSchema } from "src/admin/schemas/admin.schema";
import { ConvertModule } from "src/convert/convert.module";
import { Session, SessionSchema } from "src/user/schemas/session.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Admin.name, schema: AdminSchema },
      { name: User.name, schema: UserSchema },
      { name: Requisite.name, schema: RequisiteSchema },
      { name: Withdrawal.name, schema: WithdrawalSchema },
      { name: Session.name, schema: SessionSchema },
    ]),
    ConvertModule,
  ],
  controllers: [WithdrawalController],
  providers: [WithdrawalService],
})
export class WithdrawalModule {}
