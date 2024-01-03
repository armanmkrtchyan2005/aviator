import { ApiProperty } from "@nestjs/swagger";

export class CommissionOkResponse {
  @ApiProperty()
  commission: number;

  @ApiProperty({ example: "RUB" })
  currency: string;
}
