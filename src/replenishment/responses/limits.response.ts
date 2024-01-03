import { ApiProperty } from "@nestjs/swagger";

export class LimitsOkResponse {
  @ApiProperty()
  minLimit: number;

  @ApiProperty()
  maxLimit: number;

  @ApiProperty({ example: "RUB" })
  currency: number;
}
