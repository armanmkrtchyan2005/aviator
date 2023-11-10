import { IsNumber } from "class-validator";

export class CashOutDto {
  @IsNumber()
  betNumber: number;
}
