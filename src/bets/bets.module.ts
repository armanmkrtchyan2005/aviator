import { Module } from "@nestjs/common";
import { BetsController } from "./bets.controller";
import { BetsService } from "./bets.service";
import { MongooseModule } from "@nestjs/mongoose";
import { User, UserSchema } from "src/user/schemas/user.schema";
import { Bet, BetSchema } from "./schemas/bet.schema";
import { Coeff, CoeffSchema } from "./schemas/coeff.schema";
import { LastGame, LastGameSchema } from "./schemas/lastGame.schema";
import { Admin, AdminSchema } from "src/admin/schemas/admin.schema";
import { CurrentPlayer, CurrentPlayerSchema } from "./schemas/currentPlayers.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Bet.name, schema: BetSchema },
      { name: Coeff.name, schema: CoeffSchema },
      { name: LastGame.name, schema: LastGameSchema },
      { name: Admin.name, schema: AdminSchema },
      { name: CurrentPlayer.name, schema: CurrentPlayerSchema },
    ]),
  ],
  controllers: [BetsController],
  providers: [BetsService],
})
export class BetsModule {}
