import { ApiProperty } from "@nestjs/swagger";
import { IsMongoId } from "class-validator";

export class CancelReplenishmentDto {
  @ApiProperty()
  @IsMongoId()
  id: string;
}
