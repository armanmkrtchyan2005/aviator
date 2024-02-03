import mongoose, { HydratedDocument } from "mongoose";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { User } from "../../user/schemas/user.schema";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export type CoeffDocument = HydratedDocument<Coeff>;

@Schema()
export class Coeff {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  @Prop({ required: true })
  coeff: number;

  @ApiProperty()
  @Prop({ type: Date, expires: '10m', default: Date.now })
  createdAt: Date
}

export const CoeffSchema = SchemaFactory.createForClass(Coeff);
