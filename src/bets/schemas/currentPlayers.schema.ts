import mongoose, { HydratedDocument } from "mongoose";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { IAmount, IBet } from "./bet.schema";
import { Promo } from "src/user/schemas/promo.schema";
import { ApiProperty } from "@nestjs/swagger";

export type CurrentPlayerDocument = HydratedDocument<CurrentPlayer>;

@Schema({ _id: false })
export class CurrentPlayer implements IBet {
  @Prop({ required: true })
  _id: string;

  @ApiProperty({ type: "object", properties: { USD: { type: "number" }, RUB: { type: "number" } } })
  @Prop({ required: true, type: Object })
  bet: IAmount;

  @Prop({ required: true })
  betNumber: number;

  @Prop()
  coeff?: number;

  @Prop({ required: true })
  playerId: string;

  @Prop({ required: true })
  playerLogin: string;

  @Prop({ required: true })
  profileImage: string;

  @Prop({ type: "object" })
  promo?: Promo;

  @Prop({ required: true })
  time: Date;

  @Prop({ required: true })
  user_balance: number;

  @ApiProperty({ type: "object", properties: { USD: { type: "number" }, RUB: { type: "number" } } })
  @Prop({ type: Object })
  win?: IAmount;
}

export const CurrentPlayerSchema = SchemaFactory.createForClass(CurrentPlayer);
