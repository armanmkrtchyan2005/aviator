import mongoose, { HydratedDocument } from "mongoose";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ApiProperty } from "@nestjs/swagger";
import { User } from "./user.schema";

export type PromoDocument = HydratedDocument<Promo>;

export enum PromoType {
  ADD_BALANCE = "add_balance",
  PROMO = "promo",
}

@Schema()
export class Promo {
  @ApiProperty({ type: "string" })
  _id: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: User.name })
  to_user_id: User; // if promo is given to the specific user

  @ApiProperty({ enum: PromoType })
  @Prop({ enum: PromoType })
  type: PromoType; // add_balance or promo

  @Prop({ required: true })
  name: string;

  @ApiProperty()
  @Prop({ required: true })
  amount: number; // for add_balance it is percentage

  @ApiProperty()
  @Prop({ required: true })
  currency: string;

  @Prop()
  max_count: number;

  @Prop({ default: 0 })
  used_count: number;

  @Prop()
  limit: number; // for add_balance

  @ApiProperty()
  @Prop()
  coef: number;

  @ApiProperty()
  @Prop()
  will_finish: string;
}

export const PromoSchema = SchemaFactory.createForClass(Promo);
