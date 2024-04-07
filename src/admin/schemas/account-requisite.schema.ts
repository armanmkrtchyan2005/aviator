import mongoose, { HydratedDocument } from "mongoose";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ApiProperty } from "@nestjs/swagger";

export type AccountRequisiteDocument = HydratedDocument<AccountRequisite>;

class Turnover {
  @ApiProperty()
  @Prop({ default: 0 })
  confirmedCount: number = 0;

  @ApiProperty()
  @Prop({ default: 0 })
  confirmed: number = 0;

  @ApiProperty()
  @Prop({ default: 0 })
  inProcess: number = 0;
}

@Schema({ timestamps: true })
export class AccountRequisite {
  @ApiProperty({ type: String })
  _id: mongoose.Types.ObjectId;

  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: "accounts" })
  account: mongoose.Types.ObjectId;

  @ApiProperty()
  @Prop({ required: true })
  requisite: string;

  @ApiProperty()
  @Prop({ default: false })
  active: boolean;

  @ApiProperty()
  @Prop()
  currency: string;

  @ApiProperty()
  @Prop({
    type: Turnover,
    default: {
      confirmedCount: 0,
      confirmed: 0,
      inProcess: 0,
    },
  })
  turnover: Turnover;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  @Prop({ default: false })
  isCardFileRequired: boolean;

  @ApiProperty()
  @Prop({ default: false })
  isReceiptFileRequired: boolean;
}

export const AccountRequisiteSchema = SchemaFactory.createForClass(AccountRequisite);
