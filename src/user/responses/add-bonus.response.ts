import { ApiProperty } from "@nestjs/swagger";

export class AddBonusResponse {
  @ApiProperty({ example: "Промокод успешно активирован" })
  message: string;
}

export class AddBonusBadResponse {
  @ApiProperty({ examples: ["Нет такого промокода", "такой промокод у вас уже есть"] })
  message: string;
}
