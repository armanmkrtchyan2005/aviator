import mongoose, { HydratedDocument } from "mongoose";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ApiProperty } from "@nestjs/swagger";
import { User } from "./user.schema";

export type BonusDocument = HydratedDocument<Bonus>;

export enum CoefParamsType {
  TO_USER = "to_user",
  ADD_BALANCE = "add_balance",
  NEW_USERS = "new_users",
}

class CoefParams {
  type: CoefParamsType;

  amount_first: number;

  amount_second: number;

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
