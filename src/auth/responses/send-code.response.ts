import { HttpStatus } from "@nestjs/common";
import { ApiProperty } from "@nestjs/swagger";

export class SendCodeOkResponse {
  @ApiProperty({
    example: "Код отправлен на ваш email",
  })
  message: string;
}

export class SendCodeBadResponse {
  @ApiProperty({ example: HttpStatus.BAD_REQUEST })
  status: number;

  @ApiProperty({ example: "Пользователь с таким email не найден" })
  message: string;
}
