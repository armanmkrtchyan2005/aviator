import { Transform } from "class-transformer";
import { IsISO4217CurrencyCode, IsMongoId, IsNotEmpty, IsNumber, IsOptional, Max } from "class-validator";
import mongoose from "mongoose";

export class BetDto {
  @IsISO4217CurrencyCode()
  currency: string; // валюта ставки

  @IsNotEmpty()
  @IsNumber()
  bet: number; // сумма ставки

  @IsNotEmpty()
  @IsNumber()
  betNumber: number;

  @IsMongoId()
  @Transform(({ value }) => new mongoose.Types.ObjectId(value))
  @IsOptional()
  promoId?: mongoose.Types.ObjectId; // id бонуса (необязательно)
}
