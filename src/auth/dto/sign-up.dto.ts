import { ApiProperty } from "@nestjs/swagger";
import { IsISO4217CurrencyCode, IsAlphanumeric, IsEmail, MinLength, MaxLength, IsNotEmpty, IsNumber, IsString, IsOptional, Matches } from "class-validator";
import { Match } from "../decorators/match.decorator";

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 30;

export class SignUpDto {
  @ApiProperty({
    example: "RUB",
  })
  @IsNotEmpty({
    message: "Поле обязательно для заполнения",
  })
  @IsISO4217CurrencyCode()
  currency: string;

  @ApiProperty({
    example: "test1234",
  })
  @IsNotEmpty({
    message: "Поле обязательно для заполнения",
  })
  @MaxLength(20, { message: "Логин может содержать символы A-Z и цифры, максимум 20 символов" })
  @Matches(/^[A-Za-z0-9_]+$/, {
    message: "Логин может содержать символы A-Z и цифры, максимум 20 символов",
  })
  login: string;

  @ApiProperty({
    example: "12345678",
    minLength: PASSWORD_MIN_LENGTH,
    maxLength: PASSWORD_MAX_LENGTH,
  })
  @IsNotEmpty({
    message: "Поле обязательно для заполнения",
  })
  @MinLength(PASSWORD_MIN_LENGTH, { message: `Пароль может содержать латинские буквы и цифры, минимум ${PASSWORD_MIN_LENGTH} символов` })
  @MaxLength(PASSWORD_MAX_LENGTH, { message: `Пароль может содержать латинские буквы и цифры, максимум ${PASSWORD_MAX_LENGTH} символов` })
  password: string;

  @ApiProperty({
    example: "12345678",
  })
  @IsNotEmpty({
    message: "passwordConfirm обязательно для заполнения",
  })
  @Match("password", { message: "Пароли должны совпадать" })
  passwordConfirm: string;

  @ApiProperty({
    example: "test@gmail.com",
  })
  @IsEmail(
    {},
    {
      message: "Введите корректный email",
    },
  )
  @IsOptional()
  email: string;

  @ApiProperty({
    example: 123456,
  })
  telegramId: number;

  @ApiProperty({
    example: "promocode",
    required: false,
  })
  @IsString({ message: "promocode должно быть текстовое" })
  @IsOptional()
  promocode: string;

  @ApiProperty({
    example: "test123",
    required: false,
  })
  @IsNumber({ allowInfinity: false, allowNaN: false }, { message: "from должно быть число" })
  @IsOptional()
  from: number;
}
