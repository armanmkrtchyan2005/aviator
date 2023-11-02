import { HttpStatus } from "@nestjs/common";
import { ApiProperty } from "@nestjs/swagger";

export class SignInOkResponse {
  @ApiProperty({
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
  })
  token: string;
}

export class SignInBadResponse {
  @ApiProperty({ example: HttpStatus.BAD_REQUEST })
  status: number;

  @ApiProperty({ example: "Login or password is wrong" })
  message: string;
}
