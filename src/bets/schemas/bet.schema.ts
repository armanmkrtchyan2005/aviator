import mongoose, { HydratedDocument, Types } from "mongoose";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { User } from "../../user/schemas/user.schema";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Promo } from "src/user/schemas/promo.schema";

export type BetDocument = HydratedDocument<Bet>;

export interface IBet {
  _id?: string;
  betNumber: number;
  playerId: string;
  playerLogin: string;
  bet: number;
  currency: string;
  time: Date;
  coeff?: number;
  win?: number;
  promo?: Promo;
}

@Schema()
export class Bet {
  @ApiProperty()
  @Prop({ required: true })
  bet: number;

  @ApiProperty({ example: "USD" })
  @Prop({ required: true })
  currency: string;

  @ApiProperty()
  @Prop({ required: true })
  time: Date;

  @ApiProperty()
  @Prop()
  coeff: number;

  @ApiPropertyOptional()
  @Prop()
  win: number;

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
}

export const BetSchema = SchemaFactory.createForClass(Bet);
