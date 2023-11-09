import { IsISO4217CurrencyCode, IsNotEmpty, IsNumber } from "class-validator";

export class BetDto {
  @IsISO4217CurrencyCode()
  currency: string;

  @IsNotEmpty()
  @IsNumber()
  bet: number;
}
