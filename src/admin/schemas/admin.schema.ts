import mongoose, { HydratedDocument } from "mongoose";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ApiProperty } from "@nestjs/swagger";

export type AdminDocument = HydratedDocument<Admin>;

export interface IAlgorithms {
  id: number;
  active: boolean;
  all_bets_amount: number;
  all_withdrawal_amount: number;
  used_count: number;
}

interface IAdmin_panel_data {
  id: number;
  login: string;
  password: string;
}

interface IReplenishmentLimit {
  amount: number;
  currency: string;
}

export class GameLimits {
  @ApiProperty()
  min: number;

  @ApiProperty()
  max: number;

  @ApiProperty()
  maxWin: number;

  @ApiProperty({ example: "UZS" })
  currency: string;
}

@Schema()
export class Admin {
  _id: mongoose.Types.ObjectId;

  @Prop({
    default: [],
  })
  admin_panel_data: IAdmin_panel_data[];

  @Prop({ default: [] })
  algorithms: IAlgorithms[];

  @Prop({ type: Object, required: true, default: { amount: 10_000, currency: "UZS" } })
  minLimit: IReplenishmentLimit;

  @Prop({ type: Object, required: true, default: { amount: 2_000_000, currency: "UZS" } })
  maxLimit: IReplenishmentLimit;

  @Prop({ required: true, default: 1000 * 60 * 30 })
  timeForPay: number;

  @Prop({ required: true, default: 1 })
  commission: number;

  @Prop({ required: true, default: "USD" })
  commissionCurrency: string;

  @Prop({ required: true, type: Object })
  gameLimits: GameLimits;

  @Prop({})
  support: string;

  @Prop({ required: true, default: ["USD", "UZS", "KZT", "RUB"] })
  currencies: string[];

  @Prop({ default: 0 })
  manual_methods_balance: number;

  @Prop({ default: 0 })
  our_balance: number;
}

export const AdminSchema = SchemaFactory.createForClass(Admin);
