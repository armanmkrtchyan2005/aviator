import { ApiProperty } from "@nestjs/swagger";
import { IsCreditCard, IsISO4217CurrencyCode, IsMongoId, IsNotEmpty, IsNumber } from "class-validator";

export class CreateWithdrawalDto {
  @ApiProperty({ example: "UZS" })
  @IsISO4217CurrencyCode()
  currency: string;

  @ApiProperty({ example: 10000 })
  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsMongoId()
  requisite: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsCreditCard({ message: "Реквизит должен быть кредитной картой" })
  userRequisite: string;
}
