import { Module } from "@nestjs/common";
import { ConvertService } from "./convert.service";
import { CacheModule } from "@nestjs/cache-manager";

@Module({
  imports: [CacheModule.register()],
  providers: [ConvertService],
  exports: [ConvertService],
})
export class ConvertModule { }
