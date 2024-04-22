import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsOptional } from "class-validator";

export class CashOutDto {
  @IsNumber()
  betNumber: number; // номер ставки

  @IsNumber()
  @IsOptional()
  winX: number;
}
