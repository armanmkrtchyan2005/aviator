import mongoose, { HydratedDocument } from "mongoose";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ApiProperty } from "@nestjs/swagger";
import { IAmount } from "src/bets/schemas/bet.schema";

export type AdminDocument = HydratedDocument<Admin>;

export interface IAlgorithms {
  id: number;
  active: boolean;
  all_bets_amount: number;
  all_withdrawal_amount: number;
  used_count: number;
}

interface IBots {
  count: {
    min: number;
    max: number;
  };
  betAmount: {
    min: number;
    max: number;
  };
  coeff: {
    min: number;
    max: number;
  };
  active: boolean;
}

interface IAdmin_panel_data {
  id: number;
  login: string;
  password: string;
}

export class GameLimits {
  @ApiProperty()
  min: IAmount;

  @ApiProperty()
  max: IAmount;

  @ApiProperty()
  maxWin: IAmount;
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

  @Prop({})
  news: string;

  @Prop({})
  chat: string;

  @Prop({ required: true, default: ["USD", "UZS", "KZT", "RUB", "USDT"] })
  currencies: string[];

  @Prop({ default: 0 })
  our_balance: number;

  @Prop({ required: true, type: Object })
  bots: IBots;

  @Prop({ default: true })
  game_is_active: boolean;

  @Prop()
  game_text: string;

  @Prop()
  bot_is_active: boolean;

  @Prop()
  bot_text: string;
}

export const AdminSchema = SchemaFactory.createForClass(Admin);
