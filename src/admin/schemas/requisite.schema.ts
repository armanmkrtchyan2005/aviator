import mongoose, { HydratedDocument } from "mongoose";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ApiProperty } from "@nestjs/swagger";
import { IAmount } from "src/bets/schemas/bet.schema";

export type RequisiteDocument = HydratedDocument<Requisite>;

class RequisiteLimit {
  @ApiProperty()
  @Prop({ type: Object })
  min: IAmount;

  @ApiProperty()
  @Prop({ type: Object })
  max: IAmount;
}

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
  min_symbols_count: number;

  @ApiProperty()
  max_symbols_count: number;

  @ApiProperty()
  replenishment: boolean;

  @ApiProperty()
  withdrawal: boolean;

  @ApiProperty()
  @Prop()
  replenishmentLimit: RequisiteLimit;

  @ApiProperty()
  @Prop()
  withdrawalLimit: RequisiteLimit;

  @ApiProperty()
  @Prop({ default: 0 })
  balance: number;

  @Prop({ default: 0 })
  accountCount: number;
}

export const RequisiteSchema = SchemaFactory.createForClass(Requisite);
