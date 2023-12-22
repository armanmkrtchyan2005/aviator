import { ApiProperty } from "@nestjs/swagger";

export class MyBalanceResponse {
  @ApiProperty()
  balance: number;

  @ApiProperty()
  currency: string;
}
