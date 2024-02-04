import { Module } from "@nestjs/common";
import { ConvertService } from "./convert.service";
import { CacheModule } from "@nestjs/cache-manager";
import { ConvertController } from './convert.controller';

@Module({
  imports: [CacheModule.register()],
  providers: [ConvertService],
  exports: [ConvertService],
  controllers: [ConvertController],
})
export class ConvertModule { }
