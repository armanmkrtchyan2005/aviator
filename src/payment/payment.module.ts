import { Module } from "@nestjs/common";
import { PaymentController } from "./payment.controller";
import { PaymentService } from "./payment.service";
import { MongooseModule } from "@nestjs/mongoose";
import { Replenishment, ReplenishmentSchema } from "src/replenishment/schemas/replenishment.schema";
import { User, UserSchema } from "src/user/schemas/user.schema";
import { ConvertModule } from "src/convert/convert.module";
import { Admin, AdminSchema } from "src/admin/schemas/admin.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Replenishment.name, schema: ReplenishmentSchema },
      { name: User.name, schema: UserSchema },
    ]),
    ConvertModule,
  ],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}
