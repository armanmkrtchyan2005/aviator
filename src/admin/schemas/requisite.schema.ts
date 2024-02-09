import mongoose, { HydratedDocument } from "mongoose";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ApiProperty } from "@nestjs/swagger";

export type RequisiteDocument = HydratedDocument<Requisite>;

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

  @ApiProperty()
  @Prop({ required: true, default: false })
  active: boolean;

  @Prop({ default: false })
  isCreditCard: boolean;

  @ApiProperty()
  @Prop({ default: 0 })
  balance: number;
}

export const RequisiteSchema = SchemaFactory.createForClass(Requisite);
