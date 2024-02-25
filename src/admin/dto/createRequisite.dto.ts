import { ApiProperty } from "@nestjs/swagger";
import { IsCreditCard, IsNotEmpty } from "class-validator";

export class CreateRequisiteDto {
  @ApiProperty({ example: "0000-0000-0000-0000" })
  @IsNotEmpty()
  requisite: string;
}
