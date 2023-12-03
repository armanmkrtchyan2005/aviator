import { Transform } from "class-transformer";
import { IsISO4217CurrencyCode, IsMongoId, IsNotEmpty, IsNumber, IsOptional } from "class-validator";
import mongoose from "mongoose";

export class BetDto {
  @IsISO4217CurrencyCode()
  currency: string;

  @IsNotEmpty()
  @IsNumber()
  bet: number;

  @IsMongoId()
  @Transform(({ value }) => new mongoose.Types.ObjectId(value))
  @IsOptional()
  bonusId?: mongoose.Types.ObjectId;
}
