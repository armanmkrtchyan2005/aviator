import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, MaxLength, MinLength } from "class-validator";
import { Match } from "../decorators/match.decorator";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "./sign-up.dto";

export class ChangePasswordDto {
  @ApiProperty({
    example: "12345678",
    minLength: PASSWORD_MIN_LENGTH,
    maxLength: PASSWORD_MAX_LENGTH,
  })
  @IsNotEmpty({
    message: "Поле обязательно для заполнения",
  })
  @MinLength(6, { message: `Пароль может содержать латинские буквы и цифры, минимум ${PASSWORD_MIN_LENGTH} символов` })
  @MaxLength(30, { message: `Пароль может содержать латинские буквы и цифры, максимум ${PASSWORD_MAX_LENGTH} символов` })
  password: string;

  @ApiProperty({
    example: "12345678",
  })
  @IsNotEmpty({
    message: "Поле обязательно для заполнения",
  })
  @Match("password", { message: "Пароли должны совпадать" })
  passwordConfirm: string;
}
