import { ApiProperty } from "@nestjs/swagger";
import { IsNumber } from "class-validator";

export class CashOutDto {
  @IsNumber()
  betNumber: number; // номер ставки
}
