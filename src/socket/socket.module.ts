import { Module } from "@nestjs/common";
import { SocketService } from "./socket.service";
import { MongooseModule } from "@nestjs/mongoose";
import { User, UserSchema } from "src/user/schemas/user.schema";
import { ConvertModule } from "src/convert/convert.module";
import { Bet, BetSchema } from "src/bets/schemas/bet.schema";
import { SocketGateway } from "./socket.gateway";
import { Admin, AdminSchema } from "src/admin/schemas/admin.schema";
import { Referral, ReferralSchema } from "src/user/schemas/referral.schema";
import { Promo, PromoSchema } from "src/user/schemas/promo.schema";
import { UserPromo, UserPromoSchema } from "src/user/schemas/userPromo.schema";
import { Replenishment, ReplenishmentSchema } from "src/replenishment/schemas/replenishment.schema";
import { Session, SessionSchema } from "src/user/schemas/session.schema";
import { Game, GameSchema } from "src/bets/schemas/game.schema";
import { IdentityCounter, IdentityCounterSchema } from "src/admin/schemas/identity-counter.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Promo.name, schema: PromoSchema },
      { name: UserPromo.name, schema: UserPromoSchema },
      { name: Bet.name, schema: BetSchema },
      { name: Admin.name, schema: AdminSchema },
      { name: Referral.name, schema: ReferralSchema },
      { name: Replenishment.name, schema: ReplenishmentSchema },
      { name: Session.name, schema: SessionSchema },
      { name: Game.name, schema: GameSchema },
      { name: IdentityCounter.name, schema: IdentityCounterSchema },
    ]),
    ConvertModule,
  ],
  providers: [SocketGateway, SocketService],
  exports: [SocketGateway]
})
export class SocketModule {}
