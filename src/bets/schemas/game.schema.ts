import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ApiProperty } from "@nestjs/swagger";
import { Exclude } from "class-transformer";
import { HydratedDocument } from "mongoose";
import * as autoIncrement from "mongoose-plugin-autoinc";
import { IAmount } from "./bet.schema";

export type GameDocument = HydratedDocument<Game>;

@Schema({ timestamps: { createdAt: true } })
export class Game {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  @Prop()
  uid: number;

  @ApiProperty()
  @Prop({ index: 1 })
  game_coeff: number;

  @ApiProperty()
  @Prop({ index: -1 })
  createdAt: Date;

  @ApiProperty()
  @Prop({ index: 1 })
  endedAt: Date;

  @ApiProperty()
  @Prop({ type: Object, default: {} })
  win: IAmount;

  @ApiProperty()
  @Prop({ type: Object })
  bet: IAmount;

  @ApiProperty()
  @Prop({ default: 0 })
  bets_count: number;

  @Prop()
  @Exclude()
  algorithm_id: number;
}

export const GameSchema = SchemaFactory.createForClass(Game).plugin(autoIncrement.plugin, {
  model: Game.name,
  field: "uid",
  startAt: 10000,
  incrementBy: 1,
});
