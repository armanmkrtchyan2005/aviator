import { Module } from "@nestjs/common";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";
import { MongooseModule } from "@nestjs/mongoose";
import { User, UserSchema } from "./schemas/user.schema";
import { ConvertModule } from "src/convert/convert.module";
import { MailModule } from "src/mail/mail.module";
import { Bonus, BonusSchema } from "./schemas/bonus.schema";
import { Requisite, RequisiteSchema } from "src/admin/schemas/requisite.schema";
import { Admin, AdminSchema } from "src/admin/schemas/admin.schema";

@Module({
  imports: [
    ConvertModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Bonus.name, schema: BonusSchema },
      { name: Requisite.name, schema: RequisiteSchema },
      { name: Admin.name, schema: AdminSchema },
    ]),
    MailModule,
  ],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
