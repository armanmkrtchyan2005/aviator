import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsOptional } from "class-validator";

export class ConvertDto {
  @ApiProperty()
  from: string;

  @ApiProperty()
  to: string;

  @ApiProperty({ required: false, default: 1 })
  @IsNumber()
  @IsOptional()
  amount: number = 1;
}
