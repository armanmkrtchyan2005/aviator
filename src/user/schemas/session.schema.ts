import mongoose, { HydratedDocument } from "mongoose";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { User } from "./user.schema";

export type SessionDocument = HydratedDocument<Session>;

@Schema()
export class Session {
  @Prop({ required: true, unique: true })
  token: string;

  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: User.name })
  user: mongoose.Types.ObjectId;
}

export const SessionSchema = SchemaFactory.createForClass(Session);
