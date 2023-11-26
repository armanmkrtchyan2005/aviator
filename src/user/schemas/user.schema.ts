import mongoose, { HydratedDocument } from "mongoose";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Type } from "class-transformer";

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

  @Prop({ required: true })
  email: string;

  @Prop({ required: true, default: 0 })
  balance: number;

  @Prop({ required: true, default: 0 })
  referralBalance: number;

  @Prop({ required: false })
  promoCode: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: User.name,
  })
  @Type(() => User)
  leader: User;

  @Prop({ required: true, type: [{ type: Object }] })
  descendants: IDescendants[];
}

export const UserSchema = SchemaFactory.createForClass(User);

const a = new User();
