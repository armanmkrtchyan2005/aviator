import mongoose, { HydratedDocument } from "mongoose";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { User } from "./user.schema";
import { Transform } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export type BonusDocument = HydratedDocument<Bonus>;

export enum BalanceType {}

@Schema()
export class Bonus {
  @ApiProperty({ type: "string" })
  _id: mongoose.Types.ObjectId;

  @ApiProperty()
  @Prop({ required: true, enum: BalanceType })
  type: BalanceType;

  @ApiProperty()
  @Prop({ required: true, unique: true })
  promoCode: string;

  @ApiProperty()
  @Prop({ required: true })
  currency: string;

  @ApiProperty()
  @Prop()
  bonus: number;

  @ApiProperty()
  @Prop()
  bonusPercent: number;

  @ApiProperty()
  @Prop()
  bonusCoeff: number;

  @ApiProperty()
  @Prop({ required: true })
  maxUsedCount: number;

  @ApiProperty()
  @Prop({ required: true })
  usedCount: number;

  @ApiProperty()
  @Prop({ required: true, expires: 0 })
  expiresIn: Date;

  @ApiPropertyOptional()
  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }] })
  users: User[];
}

export const BonusSchema = SchemaFactory.createForClass(Bonus);
