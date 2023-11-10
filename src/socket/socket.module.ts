import { Module } from "@nestjs/common";
import { SocketService } from "./socket.service";
import { MongooseModule } from "@nestjs/mongoose";
import { User, UserSchema } from "src/user/schemas/user.schema";
import { ConvertModule } from "src/convert/convert.module";
import { Bet, BetSchema } from "src/user/schemas/bet.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Bet.name, schema: BetSchema },
    ]),
    ConvertModule,
  ],
  providers: [SocketService],
})
export class SocketModule {}
