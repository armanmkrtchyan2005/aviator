import mongoose, { HydratedDocument } from "mongoose";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ApiProperty } from "@nestjs/swagger";
import { User } from "./user.schema";

export type ReferralDocument = HydratedDocument<Referral>;

@Schema()
export class Referral {
  @ApiProperty({ type: String })
  _id: mongoose.Types.ObjectId;

  @ApiProperty()
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: User.name })
  user: User;

  @ApiProperty()
  @Prop()
  createdAt: Date;

  @ApiProperty()
  @Prop()
  earned: number;

  @ApiProperty()
  @Prop()
  currency: string;
}

export const ReferralSchema = SchemaFactory.createForClass(Referral);
