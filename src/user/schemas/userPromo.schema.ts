import mongoose, { HydratedDocument } from "mongoose";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { User } from "./user.schema";
import { Promo } from "./promo.schema";

export type UserPromoDocument = HydratedDocument<UserPromo>;

@Schema()
export class UserPromo {
  _id: mongoose.Types.ObjectId;

  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: User.name })
  user: User;

  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: Promo.name })
  promo: Promo;

  @Prop({ required: true, default: false })
  active: boolean
}

export const UserPromoSchema = SchemaFactory.createForClass(UserPromo);