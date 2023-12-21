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

@Module({
  imports: [
    ScheduleModule.forRoot(),
    MongooseModule.forFeature([
      { name: Admin.name, schema: AdminSchema },
      { name: User.name, schema: UserSchema },
      { name: Requisite.name, schema: RequisiteSchema },
      { name: Replenishment.name, schema: ReplenishmentSchema },
    ]),
    ConvertModule,
  ],
  controllers: [ReplenishmentController],
  providers: [ReplenishmentService],
})
export class ReplenishmentModule {}
