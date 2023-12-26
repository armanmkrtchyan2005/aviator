import { ApiProperty } from "@nestjs/swagger";
import { IsISO4217CurrencyCode, IsMongoId, IsNotEmpty, IsNumber, IsString } from "class-validator";

export class CreateWithdrawalDto {
  @ApiProperty({ example: "UZS" })
  @IsISO4217CurrencyCode()
  currency: string;

  @ApiProperty({ example: 10000 })
  @IsNumber()
  amount: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsMongoId()
  requisite: string;
}
