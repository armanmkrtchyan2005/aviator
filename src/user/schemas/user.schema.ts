import mongoose, { HydratedDocument } from "mongoose";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Exclude, Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";
import { Promo } from "./promo.schema";

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

  @ApiProperty({ example: "/image.jpg" })
  @Prop({ default: "" })
  profileImage: string;

  @Prop()
  codeToken: string;

  @Prop()
  socketId: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
