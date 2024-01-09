import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";

export class AddPromoDto {
  @ApiProperty({
    example: "NewYear2099",
  })
  @IsNotEmpty({
    message: "Поле обзательно для заполнения",
  })
  promoCode: string;
}
