import mongoose, { HydratedDocument } from "mongoose";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Type } from "class-transformer";
import { Bonus, BonusDocument } from "./bonus.schema";
import { ApiProperty } from "@nestjs/swagger";

export type UserDocument = HydratedDocument<User>;

export class Descendants {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedUt: Date;

  @ApiProperty()
  earnings: number;
}

@Schema()
export class User {
  @ApiProperty({ type: String })
  _id: mongoose.Types.ObjectId;

  @ApiProperty()
  @Prop({ required: true })
  telegramId: number;

  @ApiProperty()
  @Prop({ required: true })
  currency: string;

  @ApiProperty()
  @Prop({ required: true })
  login: string;

  @Prop({ required: true })
  password: string;

  @ApiProperty()
  @Prop()
  email: string;

  @ApiProperty()
  @Prop({ required: true, default: 0 })
  balance: number;

  @Prop({ required: true, default: 0 })
  referralBalance: number;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: User.name,
  })
  @Type(() => User)
  leader: User;

  @Prop({ required: true, type: [{ type: Object }] })
  descendants: Descendants[];

  @ApiProperty()
  @Prop({ required: true, type: [{ type: mongoose.Schema.Types.ObjectId, ref: Bonus.name, unique: true }] })
  bonuses: BonusDocument[];

  @ApiProperty({ example: "/image.jpg" })
  @Prop({ default: "" })
  profileImage: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
