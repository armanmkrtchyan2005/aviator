import { ApiProperty } from "@nestjs/swagger";

export class CancelReplenishmentResponse {
  @ApiProperty({ example: "Пополнение отменена" })
  message: string;
}

export class CancelReplenishmentBadResponse {
  @ApiProperty({ example: "Вы уже подтвердили оплату" })
  message: string;

  @ApiProperty({ example: "Bad Request" })
  error: string;

  @ApiProperty({ example: 400 })
  status: number;
}

export class ConfirmReplenishmentResponse {
  @ApiProperty({ example: "Оплата подтверждена" })
  message: string;
}
