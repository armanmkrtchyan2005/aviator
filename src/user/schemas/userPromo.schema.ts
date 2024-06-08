import mongoose, { HydratedDocument } from "mongoose";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { User } from "./user.schema";
import { Promo } from "./promo.schema";
import { Bonus } from "./bonus.schema";

export type UserPromoDocument = HydratedDocument<UserPromo>;

@Schema()
export class UserPromo {
  _id: mongoose.Types.ObjectId;

  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: User.name })
  user: User;

  @Prop({ required: false, type: mongoose.Schema.Types.ObjectId, ref: Promo.name })
  promo: Promo;

  @Prop({ required: false, type: mongoose.Schema.Types.ObjectId, ref: Bonus.name })
  bonus: Bonus;

  @Prop({ required: true, default: false })
  active: boolean;

  @Prop({})
  amount: number;

  @Prop({})
  limit: number;
}

export const UserPromoSchema = SchemaFactory.createForClass(UserPromo);
