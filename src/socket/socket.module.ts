import { Module } from "@nestjs/common";
import { SocketService } from "./socket.service";
import { MongooseModule } from "@nestjs/mongoose";
import { User, UserSchema } from "src/user/schemas/user.schema";
import { ConvertModule } from "src/convert/convert.module";
import { Bet, BetSchema } from "src/bets/schemas/bet.schema";
import { SocketGateway } from "./socket.gateway";
import { Admin, AdminSchema } from "src/admin/schemas/admin.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Bet.name, schema: BetSchema },
      { name: Admin.name, schema: AdminSchema },
    ]),
    ConvertModule,
  ],
  providers: [SocketGateway, SocketService],
})
export class SocketModule {}
