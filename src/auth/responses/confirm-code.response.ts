import { HttpStatus } from "@nestjs/common";
import { ApiProperty } from "@nestjs/swagger";

export class ConfirmCodeOkResponse {
  @ApiProperty({
    example:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY1NDI1ZDk2ZTg3ZmNkZTBmNTIzYWE1NCIsImlhdCI6MTY5ODkxMDQzNiwiZXhwIjoxNjk4OTk2ODM2fQ.3-CICCrb7jsNQjfgDqjJhnLB7K54sebRj44qdYEOzrg",
    description: "Токен для сброса пароля",
  })
  token: string;
}

export class ConfirmCodeBadResponse {
  @ApiProperty({ example: HttpStatus.BAD_REQUEST })
  status: number;

  @ApiProperty({ example: "Неверный код" })
  message: string;
}
