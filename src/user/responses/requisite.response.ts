import { ApiProperty } from "@nestjs/swagger";
import { Requisite } from "src/admin/schemas/requisite.schema";

export class FindRequisitesResponse {
  @ApiProperty({ type: [Requisite] })
  requisites: Requisite[];

  @ApiProperty({ example: "USD" })
  currency: string;
}
