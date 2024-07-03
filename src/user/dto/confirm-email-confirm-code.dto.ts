import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsNumber, IsOptional } from "class-validator";
import { ConfirmEmailSendCodeType } from "./confirm-email-send-code.dto";

export class ConfirmEmailConfirmCode {
  @ApiProperty({
    example: 123456,
  })
  @IsNotEmpty()
  @IsNumber({}, { message: "Неверный код" })
  code: number;

  @ApiProperty({
    default: ConfirmEmailSendCodeType.CHANGE,
    description: `"${ConfirmEmailSendCodeType.CHANGE}" for confirm email, "${ConfirmEmailSendCodeType.RESET}" for reset password from email`,
    enum: ConfirmEmailSendCodeType,
  })
  @IsEnum(ConfirmEmailSendCodeType)
  @IsOptional()
  type: ConfirmEmailSendCodeType = ConfirmEmailSendCodeType.CHANGE;
}
