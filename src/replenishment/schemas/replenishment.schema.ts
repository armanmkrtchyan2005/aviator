import mongoose, { HydratedDocument } from "mongoose";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ApiProperty, getSchemaPath } from "@nestjs/swagger";
import { User, UserDocument } from "src/user/schemas/user.schema";
import { Requisite } from "src/admin/schemas/requisite.schema";

export type ReplenishmentDocument = HydratedDocument<Replenishment>;

export enum ReplenishmentStatusEnum {
  PENDING = "Ожидает оплаты",
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

  @ApiProperty({ example: 100 })
  @Prop({ required: true })
  amount: number;

  @ApiProperty({ example: "USD" })
  @Prop({ required: true })
  currency: string;

  @ApiProperty({ example: 110 })
  @Prop({ required: true })
  deduction: number;

  @ApiProperty({ enum: ReplenishmentStatusEnum })
  @Prop({ required: true, default: ReplenishmentStatusEnum.PENDING, enum: ReplenishmentStatusEnum })
  status: ReplenishmentStatusEnum;

  @ApiProperty()
  @Prop()
  statusMessage: string;

  @ApiProperty()
  @Prop({ required: true, default: false })
  isPayConfirmed: boolean;

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

export const ReplenishmentSchema = SchemaFactory.createForClass(Replenishment);
