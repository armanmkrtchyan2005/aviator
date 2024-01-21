import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsNumberString } from "class-validator";

export class ConfirmCodeDto {
  @ApiProperty({
    example: 123456,
  })
  @IsNotEmpty()
  @IsNumber()
  code: number;
}
