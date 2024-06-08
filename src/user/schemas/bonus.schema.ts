import mongoose, { HydratedDocument } from "mongoose";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ApiProperty } from "@nestjs/swagger";
import { User } from "./user.schema";

export type BonusDocument = HydratedDocument<Bonus>;

export enum CoefParamsType {
  NEW_USERS = "to_user",
  ADD_BALANCE = "add_balance",
}

class CoefParams {
  @Prop({ enum: CoefParamsType })
  type: CoefParamsType;
  //new users random limits
  @Prop()
  amount_first: number;

  @Prop()
  amount_second: number;

  // add_balance
  @Prop()
  from_amount: number;

  coef: number;
}

@Schema()
export class Bonus {
  @ApiProperty({ type: "string" })
  _id: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: User.name })
  to_user_id: User; // if bonus is given to the specific user

  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: User.name }] })
  actived_users: User[];

  @Prop()
  will_finish: string;

  @Prop()
  coef_params: CoefParams;

  @Prop()
  active: boolean;
}

export const BonusSchema = SchemaFactory.createForClass(Bonus);
