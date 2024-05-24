import mongoose, { HydratedDocument, Types } from "mongoose";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { User } from "../../user/schemas/user.schema";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Promo } from "src/user/schemas/promo.schema";
import { Game } from "./game.schema";
import { UserPromoDocument } from "src/user/schemas/userPromo.schema";

export type BetDocument = HydratedDocument<Bet>;

export interface IAmount {
  [key: string]: number;
}

export type IBet = {
  _id?: string;
  betNumber: number;
  playerId: string;
  playerLogin: string;
  profileImage: string;
  bet: IAmount;
  time: Date;
  coeff?: number;
  win?: IAmount;
  promo?: Promo;
  userPromo?: UserPromoDocument;
  user_balance: number;
  game: Game;
  isBot?: boolean;
};

@Schema({ timestamps: { createdAt: true, updatedAt: "last_active_date" } })
export class Bet {
  @ApiProperty({ type: "object", properties: { USD: { type: "number" }, RUB: { type: "number" } } })
  @Prop({ required: true, type: Object })
  bet: IAmount;

  @ApiProperty()
  @Prop({ required: true })
  time: Date;

  @ApiProperty()
  @Prop()
  coeff: number;

  @ApiPropertyOptional({ type: "object", properties: { USD: { type: "number" }, RUB: { type: "number" } } })
  @Prop({ type: Object })
  win: IAmount;

  @ApiProperty({ type: String })
  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: User.name,
  })
  playerId: User;

  @ApiProperty({ type: String })
  @Prop({ require: true })
  playerLogin: string;

  @Prop({ required: true })
  user_balance: number;

  @ApiProperty()
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: Game.name })
  game: Game;

  @Prop({ default: false })
  isBot: boolean;
}

export const BetSchema = SchemaFactory.createForClass(Bet);
