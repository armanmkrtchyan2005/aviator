import mongoose, { HydratedDocument } from "mongoose";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ApiProperty } from "@nestjs/swagger";

export type RequisiteDocument = HydratedDocument<Requisite>;

export enum RequisiteStatusEnum {
  ACTIVE = "Активный",
  INACTIVE = "Неактивный",
}

@Schema({ timestamps: true })
export class Requisite {
  @ApiProperty({ type: String })
  _id: mongoose.Types.ObjectId;

  @ApiProperty()
  @Prop({ required: true })
  requisite: string;

  @ApiProperty()
  @Prop()
  name: string;

  @ApiProperty()
  @Prop()
  currency: string;

  @ApiProperty()
  @Prop()
  img: string;

  @ApiProperty()
  @Prop()
  commission: number;

  @ApiProperty({ enum: RequisiteStatusEnum })
  @Prop({ required: true, default: RequisiteStatusEnum.INACTIVE, enum: RequisiteStatusEnum })
  status: RequisiteStatusEnum;
}

export const RequisiteSchema = SchemaFactory.createForClass(Requisite);
