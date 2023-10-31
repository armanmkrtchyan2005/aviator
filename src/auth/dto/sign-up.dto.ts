import { IsISO4217CurrencyCode, IsAlphanumeric, IsEmail, IsStrongPassword, MinLength, MaxLength } from "class-validator";
import { Match } from "../decorators/match.decorator";

export class signUpDto {
  @IsISO4217CurrencyCode()
  currency: string;

  @IsAlphanumeric()
  login: string;

  @MinLength(6)
  @MaxLength(30)
  password: string;

  @Match("password", { message: "Password is not confirmed" })
  passwordConfirm: string;

  @IsEmail()
  email: string;
}
