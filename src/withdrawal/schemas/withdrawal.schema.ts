import mongoose, { HydratedDocument } from "mongoose";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ApiProperty, getSchemaPath } from "@nestjs/swagger";
import { User, UserDocument } from "src/user/schemas/user.schema";
import { Requisite } from "src/admin/schemas/requisite.schema";

export type WithdrawalDocument = HydratedDocument<Withdrawal>;

export enum WithdrawalStatusEnum {
  PENDING = "Ожидает оплаты",
  COMPLETED = "Успешно",
  CANCELED = "Отменена",
}

@Schema()
export class Withdrawal {
  @ApiProperty({ type: String })
  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: User.name })
  user: UserDocument;

  @ApiProperty({ example: 100 })
  @Prop({ required: true })
  amount: number;

  @ApiProperty({ example: "USD" })
  @Prop({ required: true })
  currency: string;

  @ApiProperty({ enum: WithdrawalStatusEnum })
  @Prop({ required: true, default: WithdrawalStatusEnum.PENDING, enum: WithdrawalStatusEnum })
  status: WithdrawalStatusEnum;

  @ApiProperty()
  @Prop()
  statusMessage: string;

  @ApiProperty()
  @Prop()
  userRequisite: string;

  @ApiProperty({ oneOf: [{ type: "string" }, { $ref: getSchemaPath(Requisite) }] })
  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: Requisite.name })
  requisite: Requisite;

  @ApiProperty()
  @Prop({ required: true, default: Date.now() })
  createdAt: Date;

  @ApiProperty()
  @Prop()
  completedDate: Date;
}

export const WithdrawalSchema = SchemaFactory.createForClass(Withdrawal);
