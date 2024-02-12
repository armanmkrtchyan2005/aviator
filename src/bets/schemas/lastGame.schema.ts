import mongoose, { HydratedDocument } from "mongoose";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Bet } from "./bet.schema";

export type LastGameDocument = HydratedDocument<LastGame>;

@Schema()
export class LastGame extends Bet {}

export const LastGameSchema = SchemaFactory.createForClass(LastGame);
