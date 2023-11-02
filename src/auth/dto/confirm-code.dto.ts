import { ApiProperty } from "@nestjs/swagger";
import { IsNumber } from "class-validator";

export class ConfirmCodeDto {
  @ApiProperty({
    example: "123456",
  })
  @IsNumber()
  code: string;
}
