import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsNumber, IsOptional, Max, Min } from "class-validator";

export class FindReferralsByDayDto {
  @ApiProperty({ example: 0, required: false, default: 0, description: "Skip elements" })
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(0)
  @IsOptional()
  skip: number = 0;

  @ApiProperty({ example: 3, minimum: 3, maximum: 25, required: false, default: 3, description: "Page limit" })
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(3)
  @Max(25)
  @IsOptional()
  limit: number = 3;
}
