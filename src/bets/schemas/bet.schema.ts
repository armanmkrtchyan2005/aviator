import mongoose, { HydratedDocument, Types } from "mongoose";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { User } from "../../user/schemas/user.schema";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export type BetDocument = HydratedDocument<Bet>;





export interface IBet {
  playerId: string;
  playerLogin: string;
  bet: number;
  currency: string;
  time: Date;
  coeff?: number;
  win?: number;
  bonusId?: Types.ObjectId;
  bonusCoeff?: number;
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
  player: User;
}

export const BetSchema = SchemaFactory.createForClass(Bet);
