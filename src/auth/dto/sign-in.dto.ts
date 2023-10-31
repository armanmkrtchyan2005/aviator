import { IsAlphanumeric, IsNotEmpty, IsString } from "class-validator";

export class SignInDto {
  @IsAlphanumeric()
  login: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
