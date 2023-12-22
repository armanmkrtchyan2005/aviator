import { ApiProperty } from "@nestjs/swagger";

export class CreateRequisiteBadResponse {
  @ApiProperty({ example: "Такой реквизит уже существует" })
  message: string;

  @ApiProperty({ example: "Bad Request" })
  error: string;

  @ApiProperty({ example: 400 })
  status: number;
}

export class ConfirmReplenishmentBadResponse {
  @ApiProperty({ example: "Вы не можете менять подтвержденную заявку" })
  message: string;

  @ApiProperty({ example: "Bad Request" })
  error: string;

  @ApiProperty({ example: 400 })
  status: number;
}

export class ConfirmReplenishmentResponse {
  @ApiProperty({ example: "Заявка подтверждена" })
  message: string;
}
