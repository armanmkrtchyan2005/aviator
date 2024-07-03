import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsOptional } from "class-validator";
import { SendEmailType } from "src/mail/mail.service";

export enum ConfirmEmailSendCodeType {
  CHANGE = SendEmailType.CHANGE,
  RESET = SendEmailType.RESET,
}

export class ConfirmEmailSendCodeDto {
  @ApiProperty({
    default: ConfirmEmailSendCodeType.CHANGE,
    description: `"${ConfirmEmailSendCodeType.CHANGE}" for confirm email, "${ConfirmEmailSendCodeType.RESET}" for reset password from email`,
    enum: ConfirmEmailSendCodeType,
  })
  @IsEnum(ConfirmEmailSendCodeType)
  @IsOptional()
  type: ConfirmEmailSendCodeType = ConfirmEmailSendCodeType.CHANGE;
}
