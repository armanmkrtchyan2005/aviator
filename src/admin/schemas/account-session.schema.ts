import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument } from "mongoose";
import { type AccountDocument, Account } from "./account.schema";

export type AccountSessionDocument = HydratedDocument<AccountSession>;

@Schema()
export class AccountSession {
  @Prop({ required: true, unique: true })
  token: string;

  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: Account.name })
  account: AccountDocument;
}

export const AccountSessionSchema = SchemaFactory.createForClass(AccountSession);
