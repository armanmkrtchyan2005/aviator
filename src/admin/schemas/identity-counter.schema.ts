import { HydratedDocument } from "mongoose";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

export type IdentityCounterDocument = HydratedDocument<IdentityCounter>;

@Schema()
export class IdentityCounter {
  @Prop()
  model: string;
  @Prop()
  field: string;
  @Prop()
  groupingField: string;
  @Prop()
  count: number;
}

export const IdentityCounterSchema = SchemaFactory.createForClass(IdentityCounter);
