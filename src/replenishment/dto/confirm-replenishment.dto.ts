import { ApiProperty } from "@nestjs/swagger";
import { IsMongoId } from "class-validator";

export class ConfirmReplenishmentDto {
  @ApiProperty()
  @IsMongoId()
  id: string;
}
