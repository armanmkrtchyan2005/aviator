import { HttpStatus } from "@nestjs/common";
import { ApiProperty } from "@nestjs/swagger";

export class ChangePasswordOkResponse {
  @ApiProperty({
    example: "",
  })
  message: string;
}

export class ChangePasswordBadResponse {
  @ApiProperty({ example: HttpStatus.BAD_REQUEST })
  status: number;

  @ApiProperty({ example: "Неверный код" })
  message: string;
}
