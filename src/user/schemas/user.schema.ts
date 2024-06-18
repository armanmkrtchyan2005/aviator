import mongoose, { HydratedDocument } from "mongoose";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";
import * as autoIncrement from "mongoose-plugin-autoinc";

const START_AT = 100000;

export type UserDocument = HydratedDocument<User>;

@Schema()
export class Descendants {
  @ApiProperty()
  @Prop()
  _id: string;

  @ApiProperty()
  @Prop()
  uid: number;

  @ApiProperty()
  @Prop()
  telegramId?: number;

  @ApiProperty()
  @Prop()
  createdAt: Date;

  @ApiProperty()
  @Prop()
  updatedUt: Date;

  @ApiProperty()
  @Prop()
  earnings: number;
}

@Schema({ timestamps: true })
export class User {
  @ApiProperty({ type: String })
  _id: mongoose.Types.ObjectId;

  @ApiProperty()
  @Prop({ type: Number, unique: true })
  uid: number;

  @ApiProperty()
  @Prop()
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
  @Prop({ default: "" })
  email: string;

  @ApiProperty()
  @Prop({ required: true, default: 0 })
  balance: number;

  @Prop({ required: true, default: 0 })
  startBalance: number;

  @Prop({ default: 0 })
  playedAmount: number;

  @Prop({ required: true, default: 0 })
  referralBalance: number;

  @Prop({ required: true, default: 0 })
  sumWithdrawal: number;

  @Prop({ required: true, default: 0 })
  sumReplenishment: number;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: User.name,
  })
  @Type(() => User)
  leader: UserDocument;

  @Prop({ required: true, type: [{ type: Descendants }] })
  descendants: Descendants[];

  @ApiProperty({ example: "/image.jpg" })
  @Prop({ default: "" })
  profileImage: string;

  @Prop()
  codeToken: string;

  @ApiProperty()
  @Prop({ default: false })
  twoFA: boolean;

  @Prop()
  twoFAToken: string;

  @Prop()
  emailUpdatedAt: Date;

  @Prop({ default: true })
  active: boolean;

  @Prop()
  lastActiveDate: Date;

  @Prop()
  socketId: string;

  @Prop({ default: false })
  isWithdrawalAllowed: boolean;

  @Prop({ default: false })
  banned: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User).plugin(autoIncrement.plugin, {
  model: User.name,
  field: "uid",
  startAt: START_AT,
  incrementBy: 1,
});
