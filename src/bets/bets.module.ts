import { Module } from "@nestjs/common";
import { BetsController } from "./bets.controller";
import { BetsService } from "./bets.service";
import { MongooseModule } from "@nestjs/mongoose";
import { User, UserSchema } from "src/user/schemas/user.schema";
import { Bet, BetSchema } from "./schemas/bet.schema";
import { Admin, AdminSchema } from "src/admin/schemas/admin.schema";
import { Session, SessionSchema } from "src/user/schemas/session.schema";
import { Game, GameSchema } from "./schemas/game.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Bet.name, schema: BetSchema },
      { name: Admin.name, schema: AdminSchema },
      { name: Session.name, schema: SessionSchema },
      { name: Game.name, schema: GameSchema },
    ]),
  ],
  controllers: [BetsController],
  providers: [BetsService],
})
export class BetsModule {}
