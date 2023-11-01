import { IsNumber } from "class-validator";

export class ConfirmCodeDto {
  @IsNumber()
  code: string;
}
