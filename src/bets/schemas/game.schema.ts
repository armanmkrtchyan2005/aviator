import mongoose, { HydratedDocument } from "mongoose";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ApiProperty } from "@nestjs/swagger";
import * as autoIncrement from "mongoose-plugin-autoinc";
import { Exclude } from "class-transformer";

export type GameDocument = HydratedDocument<Game>;

@Schema({ timestamps: { createdAt: true } })
export class Game {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  @Prop()
  uid: number;

  @ApiProperty()
  @Prop()
  game_coeff: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  @Prop()
  endedAt: Date;

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
