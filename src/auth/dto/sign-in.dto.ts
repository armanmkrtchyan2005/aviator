import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class SignInDto {
  @ApiProperty({
    example: "test1234",
  })
  @IsNotEmpty()
  @IsString({ message: "Поле должно быть строкой" })
  login: string;

  @ApiProperty({
    example: "123456",
  })
  @IsNotEmpty()
  @IsString({ message: "Поле должно быть строкой" })
  password: string;
}
