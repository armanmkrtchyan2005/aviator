import { ApiProperty } from "@nestjs/swagger";
import { SignUpDto } from "./sign-up.dto";
import { IsJWT, IsNumber } from "class-validator";

export class SignUpConfirmDto extends SignUpDto {
  @ApiProperty()
  @IsJWT({ message: "token должен быть jwt" })
  token: string;

  @ApiProperty()
  @IsNumber({ allowInfinity: false, allowNaN: false }, { message: "code должен быть числом" })
  code: number;
}
