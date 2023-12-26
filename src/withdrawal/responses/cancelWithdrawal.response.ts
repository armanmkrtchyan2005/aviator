import { ApiProperty } from "@nestjs/swagger";

export class CancelWithdrawalOkResponse {
  @ApiProperty({ example: "Пополнение отменена" })
  message: string;
}

export class CancelWithdrawalBadResponse {
  @ApiProperty({ example: "Вы не можете менять заявку" })
  message: string;
}
