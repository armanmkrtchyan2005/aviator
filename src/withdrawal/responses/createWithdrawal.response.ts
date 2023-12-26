import { ApiProperty } from "@nestjs/swagger";

export class CreateWithdrawalBadResponse {
  @ApiProperty({ example: "Недостаточно средств на балансе!" })
  message: string;
}
