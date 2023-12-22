import { ApiProperty } from "@nestjs/swagger";

export class ConfirmEmailSendCodeResponse {
  @ApiProperty({ example: "На ваш Email отправлен код для подтверждения" })
  message: string;
}

export class ConfirmEmailConfirmCodeResponse {
  @ApiProperty({ example: "Ваш email подтверждён" })
  message: string;
}

export class ConfirmEmailConfirmCodeBadResponse {
  @ApiProperty({ example: "Неверный код" })
  message: string;

  @ApiProperty({ example: "Bad Request" })
  error: "Bad Request";

  @ApiProperty({ example: 400 })
  statusCode: 400;
}

export class ChangeEmailConfirmCodeResponse {
  @ApiProperty({ example: "Ваш email успешно изменен" })
  message: string;
}

export class OldPasswordConfirmBadResponse {
  @ApiProperty({ example: "Неверный пароль" })
  message: string;

  @ApiProperty({ example: "Bad Request" })
  error: "Bad Request";

  @ApiProperty({ example: 400 })
  statusCode: 400;
}

export class ChangePasswordBadResponse {
  @ApiProperty({ example: ["Поле обязательно для заполнения"] })
  message: string[];

  @ApiProperty({ example: "Bad Request" })
  error: "Bad Request";

  @ApiProperty({ example: 400 })
  statusCode: 400;
}

export class ChangePasswordResponse {
  @ApiProperty({ example: "Ваш пароль успешно изменен" })
  message: string;
}
