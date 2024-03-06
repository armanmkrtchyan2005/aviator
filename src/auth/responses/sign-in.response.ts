import { HttpStatus } from "@nestjs/common";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class SignInOkResponse {
  @ApiProperty({ example: false })
  twoFactorEnabled: boolean;

  @ApiPropertyOptional({
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
    description: "Токен для авторизации",
  })
  token: string;

  @ApiProperty()
  message: string;
}

export class SignInTwoFAResponse {
  @ApiProperty()
  twoFA: boolean;

  @ApiProperty()
  message: string;
}

export class SignInBadResponse {
  @ApiProperty({ example: HttpStatus.BAD_REQUEST })
  status: number;

  @ApiProperty({ example: "Логин или пароль неправильный" })
  message: string;
}
