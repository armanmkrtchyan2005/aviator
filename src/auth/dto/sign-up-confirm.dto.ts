import { ApiProperty } from "@nestjs/swagger";
import { SignUpDto } from "./sign-up.dto";
import { IsJWT, IsNumber } from "class-validator";

export class SignUpConfirmDto extends SignUpDto {
  @ApiProperty()
  @IsJWT({ message: "token должен быть jwt" })
  token: string;

  @ApiProperty()
  @IsNumber({}, { message: "code должен быть числом" })
  code: number;
}
