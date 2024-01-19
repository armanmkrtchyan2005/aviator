import { ApiProperty } from "@nestjs/swagger";
import { Descendants } from "../schemas/user.schema";

export class ReferralOkResponse {
  @ApiProperty({ example: "RUB" })
  currency: string;

  @ApiProperty()
  referralBalance: number;

  @ApiProperty({ type: [Descendants] })
  descendants: Descendants[];
}


export class ReferralByDaysOkResponse {
  @ApiProperty()
  date: Date

  @ApiProperty()
  totalEarned: number
}