import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";

export class OldPasswordConfirmDto {
  @ApiProperty({
    example: "12345678",
  })
  @IsNotEmpty({
    message: "Поле обзательно для заполнения",
  })
  password: string;
}
