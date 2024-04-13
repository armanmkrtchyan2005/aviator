import { ApiProperty } from "@nestjs/swagger";

export class LinksResponse {
  @ApiProperty()
  support: string;

  @ApiProperty()
  news: string;

  @ApiProperty()
  chat: string;
}
