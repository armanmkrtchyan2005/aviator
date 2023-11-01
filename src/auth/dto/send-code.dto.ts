import { IsEmail } from "class-validator";

export class SendCodeDto {
  @IsEmail()
  email: string;
}
