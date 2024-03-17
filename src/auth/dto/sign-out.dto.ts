import { ApiProperty } from "@nestjs/swagger";
import { IsJWT } from "class-validator";

export class SignOutDto {
  @ApiProperty()
  @IsJWT()
  token: string;
}
