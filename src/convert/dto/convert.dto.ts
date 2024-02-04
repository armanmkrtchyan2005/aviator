import { ApiProperty } from "@nestjs/swagger";
import { IsISO4217CurrencyCode, IsNumber, IsOptional } from "class-validator";

export class ConvertDto {
  @ApiProperty()
  @IsISO4217CurrencyCode()
  from: string;

  @ApiProperty()
  @IsISO4217CurrencyCode()
  to: string;

  @ApiProperty({ required: false, default: 1 })
  @IsNumber()
  @IsOptional()
  amount: number = 1;
}
