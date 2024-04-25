import mongoose, { HydratedDocument } from "mongoose";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ApiProperty } from "@nestjs/swagger";
import { IAmount } from "src/bets/schemas/bet.schema";

export type RequisiteDocument = HydratedDocument<Requisite>;

class RequisiteLimit {
  @ApiProperty()
  @Prop()
  min: number;

  @ApiProperty()
  @Prop()
  max: number;
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
  @Prop()
  min_symbols_count: number;

  @ApiProperty()
  @Prop()
  max_symbols_count: number;

  @ApiProperty()
  @Prop()
  replenishment: boolean;

  @ApiProperty()
  @Prop()
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

  @Prop({ default: false })
  donatePay: boolean;

  @Prop({ default: false })
  AAIO: boolean;

  @Prop({ type: Object })
  donatePaylimit: {
    min: number;
    max: number;
  };

  @Prop({ type: Object })
  AAIOlimit: {
    min: number;
    max: number;
  };
}

export const RequisiteSchema = SchemaFactory.createForClass(Requisite);
