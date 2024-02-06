import { Module } from "@nestjs/common";
import { LinksController } from "./links.controller";
import { LinksService } from "./links.service";
import { MongooseModule } from "@nestjs/mongoose";
import { Admin, AdminSchema } from "src/admin/schemas/admin.schema";

@Module({
  imports: [MongooseModule.forFeature([{ name: Admin.name, schema: AdminSchema }])],
  controllers: [LinksController],
  providers: [LinksService],
})
export class LinksModule {}
