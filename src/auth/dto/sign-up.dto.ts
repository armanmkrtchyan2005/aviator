import { ApiProperty } from "@nestjs/swagger";
import { IsISO4217CurrencyCode, IsAlphanumeric, IsEmail, MinLength, MaxLength, IsNotEmpty } from "class-validator";
import { Match } from "../decorators/match.decorator";

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 30;

export class SignUpDto {
  @ApiProperty({
    example: "RUB",
  })
  @IsNotEmpty({
    message: "Поле обзательно для заполнения",
  })
  @IsISO4217CurrencyCode()
  currency: string;

  @ApiProperty({
    example: "test1234",
  })
  @IsNotEmpty({
    message: "Поле обзательно для заполнения",
  })
  @IsAlphanumeric("en-US", {
    message: "Логин может содержать символы A-Z и цифры, максимум 20 символов",
  })
  login: string;

  @ApiProperty({
    example: "12345678",
    minLength: PASSWORD_MIN_LENGTH,
    maxLength: PASSWORD_MAX_LENGTH,
  })
  @IsNotEmpty({
    message: "Поле обзательно для заполнения",
  })
  @MinLength(6, { message: `Пароль может содержать латинские буквы и цифры, минимум ${PASSWORD_MIN_LENGTH} символов` })
  @MaxLength(30, { message: `Пароль может содержать латинские буквы и цифры, максимум ${PASSWORD_MAX_LENGTH} символов` })
  password: string;

  @ApiProperty({
    example: "12345678",
  })
  @IsNotEmpty({
    message: "Поле обзательно для заполнения",
  })
  @Match("password", { message: "Пароли должны совпадать" })
  passwordConfirm: string;

  @ApiProperty({
    example: "test@gmail.com",
  })
  @IsNotEmpty({
    message: "Поле обзательно для заполнения",
  })
  @IsEmail(
    {},
    {
      message: "Введите корректный email",
    },
  )
  email: string;
}
