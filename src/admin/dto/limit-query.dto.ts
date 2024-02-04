import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsDate, IsNumber, IsOptional, Max, Min } from "class-validator";

export class LimitQueryDto {
  @ApiProperty({ example: 0, required: false, minimum: 0, default: 0, description: "Skip elements" })
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(0)
  @IsOptional()
  skip: number = 0;

  @ApiProperty({ example: 10, required: false, default: 10, minimum: 10, maximum: 100, description: "Page limit" })
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(10)
  @Max(100)
  @IsOptional()
  limit: number = 10;

  @ApiProperty({ required: false })
  @Transform(({ value }) => new Date(value))
  @IsDate()
  @IsOptional()
  stateDate: Date;

  @ApiProperty({ required: false })
  @Transform(({ value }) => new Date(value))
  @IsDate()
  @IsOptional()
  endDate: Date;
}
