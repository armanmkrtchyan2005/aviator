import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "./auth/auth.module";
import { MongooseModule } from "@nestjs/mongoose";
import { UserModule } from "./user/user.module";
import { MailModule } from "./mail/mail.module";
import { ConvertModule } from "./convert/convert.module";
import { SocketModule } from "./socket/socket.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ".env",
      isGlobal: true,
    }),
    MongooseModule.forRoot(process.env.MONGO_URI),
    AuthModule,
    UserModule,
    MailModule,
    ConvertModule,
    SocketModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
