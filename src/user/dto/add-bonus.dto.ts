import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";

export class AddBonusDto {
  @ApiProperty({
    example: "NewYear2099",
  })
  @IsNotEmpty({
    message: "Поле обзательно для заполнения",
  })
  promoCode: string;
}
