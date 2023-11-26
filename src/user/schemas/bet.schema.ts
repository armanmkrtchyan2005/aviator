import mongoose, { HydratedDocument } from "mongoose";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { User } from "./user.schema";

export type BetDocument = HydratedDocument<Bet>;

export interface IBet {
  player: string;
  bet: number;
  currency: string;
  time: Date;
  coeff?: number;
  win?: number;
}

@Schema()
export class Bet {
  @Prop({ required: true })
  bet: number;

  @Prop({ required: true })
  currency: string;

  @Prop({ required: true })
  time: Date;

  @Prop()
  coeff: number;

  @Prop()
  win: number;

  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: User.name,
  })
  player: User;
}

export const BetSchema = SchemaFactory.createForClass(Bet);
