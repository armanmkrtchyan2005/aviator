import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class AdminLoginDto {
  @ApiProperty({ example: "test123" })
  @IsNotEmpty()
  @IsString()
  login: string;

  @ApiProperty({ example: "123456" })
  @IsNotEmpty()
  @IsString()
  password: string;
}
