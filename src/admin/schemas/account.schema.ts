import mongoose, { HydratedDocument } from "mongoose";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ApiProperty } from "@nestjs/swagger";
import { Requisite } from "./requisite.schema";

export type AccountDocument = HydratedDocument<Account>;

@Schema({ timestamps: true })
export class Account {
  @ApiProperty({ type: String })
  _id: mongoose.Types.ObjectId;

  @ApiProperty()
  @Prop({})
  login: string;

  @Prop({})
  password: string;

  @ApiProperty()
  @Prop({ default: 0 })
  replenishmentBonus: number;

  @ApiProperty()
  @Prop({ default: 0 })
  withdrawalBonus: number;

  @ApiProperty()
  @Prop({ default: 0 })
  balance: number;

  @ApiProperty()
  @ApiProperty()
  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: Requisite.name })
  requisite: Requisite;
}

export const AccountSchema = SchemaFactory.createForClass(Account);
