import mongoose, { HydratedDocument } from "mongoose";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ApiProperty } from "@nestjs/swagger";
import { Requisite } from "./requisite.schema";

export type AccountDocument = HydratedDocument<Account>;

@Schema({ timestamps: true })
export class Account {
  @ApiProperty({ type: String })
  _id: mongoose.Types.ObjectId;

  @Prop({})
  login: string;

  @Prop({})
  password: string;

  @Prop({ default: 0 })
  replenishmentBonus: number;

  @Prop({ default: 0 })
  withdrawalBonus: number;

  @Prop({ default: 0 })
  balance: number;

  @ApiProperty()
  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: Requisite.name })
  requisite: Requisite;
}

export const AccountSchema = SchemaFactory.createForClass(Account);
