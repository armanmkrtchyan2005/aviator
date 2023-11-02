import { ApiProperty } from "@nestjs/swagger";
import { IsEmail } from "class-validator";

export class SendCodeDto {
  @ApiProperty({
    example: "test@gmail.com",
  })
  @IsEmail(
    {},
    {
      message: "Введите корректный email",
    },
  )
  email: string;
}
