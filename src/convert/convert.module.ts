import { Module } from "@nestjs/common";
import { ConvertService } from "./convert.service";

@Module({
  providers: [ConvertService],
  exports: [ConvertService],
})
export class ConvertModule {}
