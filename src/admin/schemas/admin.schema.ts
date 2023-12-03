import { HydratedDocument } from "mongoose";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

export type AdminDocument = HydratedDocument<Admin>;

export interface IAlgorithms {
  id: number;
  active: boolean;
}

@Schema()
export class Admin {
  @Prop({ default: [] })
  algorithms: IAlgorithms[];
}

export const AdminSchema = SchemaFactory.createForClass(Admin);
