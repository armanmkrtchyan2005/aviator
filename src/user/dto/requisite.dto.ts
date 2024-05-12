import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsOptional } from "class-validator";

export enum RequisiteTypeEnum {
  REPLENISHMENT = "replenishment",
  WITHDRAWAL = "withdrawal",
  PROFILE = "profile",
}

export class RequisiteDto {
  @ApiProperty({ default: RequisiteTypeEnum.REPLENISHMENT, enum: RequisiteTypeEnum })
  @IsEnum(RequisiteTypeEnum)
  @IsOptional()
  type: RequisiteTypeEnum = RequisiteTypeEnum.REPLENISHMENT;
}
