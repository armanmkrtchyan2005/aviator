import mongoose, { HydratedDocument } from "mongoose";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Type } from "class-transformer";
import { Bonus, BonusDocument } from "./bonus.schema";

export type UserDocument = HydratedDocument<User>;

interface IDescendants {
  _id: string;
  createdAt: Date;
  earnings: number;
}

@Schema()
export class User {
  @Prop({ required: true })
  telegramId: number;

  @Prop({ required: true })
  currency: string;

  @Prop({ required: true })
  login: string;

  @Prop({ required: true })
  password: string;

  @Prop()
  email: string;

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
  descendants: IDescendants[];

  @Prop({ required: true, type: [{ type: mongoose.Schema.Types.ObjectId, ref: Bonus.name, unique: true }] })
  bonuses: BonusDocument[];
}

export const UserSchema = SchemaFactory.createForClass(User);
