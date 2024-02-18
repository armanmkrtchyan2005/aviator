import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsDate, IsNumber, IsOptional, IsString, Max, Min } from "class-validator";

export class LimitQueryDto {
  @ApiProperty({ example: 0, required: false, description: "Skip elements" })
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(0)
  @IsOptional()
  skip?: number;

  @ApiProperty({ example: 10, required: false, description: "Page limit" })
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @IsOptional()
  limit?: number;

  @ApiProperty({ required: false })
  @Transform(({ value }) => new Date(value))
  @IsDate()
  @IsOptional()
  startDate?: Date;

  @ApiProperty({ required: false })
  @Transform(({ value }) => new Date(value))
  @IsDate()
  @IsOptional()
  endDate?: Date = new Date();
}
