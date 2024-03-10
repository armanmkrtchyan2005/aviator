import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsEnum, IsNumber, IsOptional, Max, Min } from "class-validator";

export enum DateSort {
  DAY = "day",
  MONTH = "month",
  YEAR = "year",
}

export class TopBetsQueryDto {
  @ApiProperty({ required: false, enum: DateSort, default: DateSort.DAY })
  @IsEnum(DateSort)
  @IsOptional()
  dateSort: DateSort = DateSort.DAY;
}
