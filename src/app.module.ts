import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { MulterModule } from "@nestjs/platform-express";
import { ScheduleModule } from "@nestjs/schedule";
import { ThrottlerModule } from "@nestjs/throttler";
import { memoryStorage } from "multer";
import { AdminModule } from "./admin/admin.module";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AuthModule } from "./auth/auth.module";
import { BetsModule } from "./bets/bets.module";
import { LinksModule } from "./links/links.module";
import { PaymentModule } from "./payment/payment.module";
import { ReplenishmentModule } from "./replenishment/replenishment.module";
import { SocketModule } from "./socket/socket.module";
import { TwoFaModule } from "./two-fa/two-fa.module";
import { UserModule } from "./user/user.module";
import { WithdrawalModule } from "./withdrawal/withdrawal.module";

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        name: "short",
        ttl: 1000,
        limit: 3,
      },
      {
        name: "medium",
        ttl: 10000,
        limit: 20,
      },
      {
        name: "long",
        ttl: 60000,
        limit: 100,
      },
    ]),
    ConfigModule.forRoot({
      envFilePath: ".env",
      isGlobal: true,
    }),
    MulterModule.register({
      storage: memoryStorage(),
    }),
    MongooseModule.forRoot(process.env.MONGO_URI),
    AuthModule,
    UserModule,
    SocketModule,
    BetsModule,
    AdminModule,
    ReplenishmentModule,
    WithdrawalModule,
    LinksModule,
    TwoFaModule,
    PaymentModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
