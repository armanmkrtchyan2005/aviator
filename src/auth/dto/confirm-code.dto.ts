import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsNumberString, IsOptional, IsString } from "class-validator";

export class ConfirmCodeDto {
  @ApiProperty({
    example: 123456,
  })
  @IsNotEmpty()
  @IsNumber()
  code: number;

  @ApiProperty({ example: "test@gmail.com", format: "email" })
  @IsOptional()
  email: string;
}
