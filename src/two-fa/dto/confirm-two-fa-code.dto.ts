import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber } from "class-validator";

export class ConfirmTwoFACodeDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  code: number;
}
