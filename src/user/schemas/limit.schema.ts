import mongoose, { HydratedDocument } from "mongoose";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ApiProperty } from "@nestjs/swagger";
import { User } from "./user.schema";

export type LimitDocument = HydratedDocument<Limit>;

export enum LimitType {
  BLOCKED = "заблокирован",
  UNLOCKED = "разблокирован",
}

@Schema()
export class Limit {
  @Prop({ required: true })
  id: string;

  @Prop({ enum: LimitType })
  type: LimitType;

  @Prop({ required: true })
  action_by: number;

  @Prop({ required: true })
  reason: string;

  @Prop()
  unban_date: string;

  @Prop({ required: true })
  createdAt: Date;
}

export const LimitSchema = SchemaFactory.createForClass(Limit);
