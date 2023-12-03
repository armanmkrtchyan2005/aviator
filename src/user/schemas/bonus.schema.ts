import mongoose, { HydratedDocument } from "mongoose";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { User } from "./user.schema";
import { Transform } from "class-transformer";

export type BonusDocument = HydratedDocument<Bonus>;

@Schema()
export class Bonus {
  @Prop({ required: true })
  type: "promo" | "addBalance";

  @Prop({ required: true, unique: true })
  promoCode: string;

  @Prop({ required: true })
  currency: string;

  @Prop()
  bonus: number;

  @Prop()
  bonusPercent: number;

  @Prop()
  bonusCoeff: number;

  @Prop({ required: true })
  maxUsedCount: number;

  @Prop({ required: true })
  usedCount: number;

  @Prop({ required: true, expires: 0 })
  expiresIn: Date;

  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }] })
  users: User[];
}

export const BonusSchema = SchemaFactory.createForClass(Bonus);
