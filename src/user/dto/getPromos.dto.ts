import { ApiProperty } from "@nestjs/swagger";
import { PromoType } from "../schemas/promo.schema";
import { Optional } from "@nestjs/common";
import { IsEnum } from "class-validator";

export class GetPromosDto {
  @ApiProperty({ enum: PromoType })
  @IsEnum(PromoType)
  type: PromoType;
}
