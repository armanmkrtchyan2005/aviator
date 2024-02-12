import mongoose, { HydratedDocument, Types } from "mongoose";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { User } from "../../user/schemas/user.schema";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Promo } from "src/user/schemas/promo.schema";

export type BetDocument = HydratedDocument<Bet>;

export interface IAmount {
  [key: string]: number;
}

export interface IBet {
  _id?: string;
  betNumber: number;
  playerId: string;
  playerLogin: string;
  playerImg: string;
  bet: IAmount;
  // currency: string;
  time: Date;
  coeff?: number;
  win?: IAmount;
  promo?: Promo;
}

@Schema()
export class Bet {
  @ApiProperty({ type: "object", properties: { USD: { type: "number" }, RUB: { type: "number" } } })
  @Prop({ required: true, type: Object })
  bet: IAmount;

  // @ApiProperty({ example: "USD" })
  // @Prop({ required: true })
  // currency: string;

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

  @ApiProperty({ type: String })
  @Prop()
  playerImg: string;
}

export const BetSchema = SchemaFactory.createForClass(Bet);
