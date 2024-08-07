import mongoose, { HydratedDocument } from "mongoose";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ApiProperty } from "@nestjs/swagger";
import { User, UserDocument } from "src/user/schemas/user.schema";
import { Requisite, RequisiteDocument } from "src/admin/schemas/requisite.schema";
import { Account } from "src/admin/schemas/account.schema";
import { IAmount } from "src/bets/schemas/bet.schema";
import * as autoIncrement from "mongoose-plugin-autoinc";

export type WithdrawalDocument = HydratedDocument<Withdrawal>;

export enum WithdrawalStatusEnum {
  PENDING = "Ожидает оплаты",
  COMPLETED = "Успешно",
  CANCELED = "Отменена",
}

@Schema({ timestamps: { createdAt: true } })
export class Withdrawal {
  @ApiProperty()
  _id: string;

  @ApiProperty({ type: String })
  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: User.name })
  user: UserDocument;

  @ApiProperty({ properties: { USD: { example: 110 } } })
  @Prop({ required: true, type: Object })
  amount: IAmount;

  @ApiProperty({ enum: WithdrawalStatusEnum })
  @Prop({ required: true, default: WithdrawalStatusEnum.PENDING, enum: WithdrawalStatusEnum })
  status: WithdrawalStatusEnum;

  @ApiProperty()
  @Prop()
  statusMessage: string;

  @ApiProperty()
  @Prop()
  userRequisite: string;

  @ApiProperty({ type: Requisite })
  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: Requisite.name })
  requisite: RequisiteDocument;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  @Prop()
  completedDate: Date;

  @ApiProperty({ type: String })
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: Account.name })
  active: Account;

  @Prop({})
  activeAt: Date;

  @ApiProperty()
  uid: number;
}

export const WithdrawalSchema = SchemaFactory.createForClass(Withdrawal).plugin(autoIncrement.plugin, {
  model: "replenishment-withdrawal",
  field: "uid",
  startAt: 10000,
  incrementBy: 1,
});
