import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsNumber, IsOptional, Max, Min } from "class-validator";

export class MyBetsQueryDto {
  @ApiProperty({ example: 0, required: false, default: 0, description: "Skip elements" })
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(0)
  @IsOptional()
  skip: number = 0;

  @ApiProperty({ example: 6, required: false, default: 6, description: "Page limit" })
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(5)
  @Max(25)
  @IsOptional()
  limit: number = 6;
}
