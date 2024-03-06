import mongoose, { HydratedDocument } from "mongoose";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ApiProperty, getSchemaPath } from "@nestjs/swagger";
import { User, UserDocument } from "src/user/schemas/user.schema";
import { Requisite, RequisiteDocument } from "src/admin/schemas/requisite.schema";
import { IAmount } from "src/bets/schemas/bet.schema";
import { Account } from "src/admin/schemas/account.schema";
import { AccountRequisite, AccountRequisiteDocument } from "src/admin/schemas/account-requisite.schema";
import * as autoIncrement from "mongoose-plugin-autoinc";

export type ReplenishmentDocument = HydratedDocument<Replenishment>;

export enum ReplenishmentStatusEnum {
  PENDING = "Ожидает оплаты",
  PROCESSING = "В обработке...",
  COMPLETED = "Успешно завершена",
  CANCELED = "Отменена",
}

@Schema()
export class Replenishment {
  @ApiProperty({ type: String })
  _id: mongoose.Types.ObjectId;

  @ApiProperty({ type: String })
  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: User.name })
  user: UserDocument;

  @ApiProperty({ properties: { USD: { example: 100 } } })
  @Prop({ required: true, type: Object })
  amount: IAmount;

  @ApiProperty({ properties: { USD: { example: 110 } } })
  @Prop({ required: true, type: Object })
  deduction: IAmount;

  @ApiProperty({ enum: ReplenishmentStatusEnum })
  @Prop({ required: true, default: ReplenishmentStatusEnum.PENDING, enum: ReplenishmentStatusEnum })
  status: ReplenishmentStatusEnum;

  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: Account.name })
  account: Account;

  @ApiProperty()
  @Prop()
  statusMessage: string;

  @ApiProperty()
  @Prop({ required: true, default: false })
  isPayConfirmed: boolean;

  @ApiProperty({ type: AccountRequisite })
  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: AccountRequisite.name })
  requisite: AccountRequisiteDocument;

  @ApiProperty()
  @Prop({ required: true, default: Date.now() })
  createdAt: Date;

  @ApiProperty()
  @Prop()
  completedDate: Date;
}

export const ReplenishmentSchema = SchemaFactory.createForClass(Replenishment).plugin(autoIncrement.plugin, {
  model: "replenishment-withdrawal",
  field: "uid",
  startAt: 1,
  incrementBy: 1,
});
