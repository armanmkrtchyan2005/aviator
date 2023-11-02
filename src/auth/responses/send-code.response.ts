import { HttpStatus } from "@nestjs/common";
import { ApiProperty } from "@nestjs/swagger";

export class SendCodeOkResponse {
  @ApiProperty({
    example: "Code sended to your email",
  })
  message: string;
}

export class SendCodeBadResponse {
  @ApiProperty({ example: HttpStatus.BAD_REQUEST })
  status: number;

  @ApiProperty({ example: "User from this email not founded" })
  message: string;
}
