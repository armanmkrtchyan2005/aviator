import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "./auth/auth.module";
import { MongooseModule } from "@nestjs/mongoose";
import { UserModule } from "./user/user.module";
import { SocketModule } from "./socket/socket.module";
import { BetsModule } from "./bets/bets.module";
import { AdminModule } from "./admin/admin.module";
import { ReplenishmentModule } from "./replenishment/replenishment.module";
import { WithdrawalModule } from "./withdrawal/withdrawal.module";
import { LinksModule } from "./links/links.module";
import { ThrottlerModule } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerProxyGuard } from "./pipes/throttler-proxy.guard";
import { MulterModule } from "@nestjs/platform-express";
import { memoryStorage } from "multer";

@Module({
  imports: [
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
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerProxyGuard,
    },
  ],
})
export class AppModule {}
