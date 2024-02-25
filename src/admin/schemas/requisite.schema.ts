import mongoose, { HydratedDocument } from "mongoose";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ApiProperty } from "@nestjs/swagger";

export type RequisiteDocument = HydratedDocument<Requisite>;

@Schema({ timestamps: true })
export class Requisite {
  @ApiProperty({ type: String })
  _id: mongoose.Types.ObjectId;

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

  @ApiProperty()
  @Prop({ default: 0 })
  balance: number;

  @Prop({ default: 0 })
  accountCount: number;
}

export const RequisiteSchema = SchemaFactory.createForClass(Requisite);
