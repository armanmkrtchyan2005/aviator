import { Body, Controller, Post, Put, Req } from "@nestjs/common";
import { ApiBadRequestResponse, ApiOkResponse, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { Auth } from "src/auth/decorators/auth.decorator";
import { TwoFaService } from "./two-fa.service";
import { ConfirmTwoFACodeDto } from "./dto/confirm-two-fa-code.dto";

@ApiTags("2fa")
@Auth()
@Controller("two-fa")
export class TwoFaController {
  constructor(private readonly twoFaService: TwoFaService) {}

  @ApiResponse({ schema: { type: "object", properties: { message: { type: "string" } } } })
  @Post("set/on")
  twoFAOn(@Req() req: Request) {
    return this.twoFaService.twoFAOn(req["user"]);
  }

  @ApiResponse({ schema: { type: "object", properties: { message: { type: "string" } } } })
  @Post("set/off")
  twoFAOff(@Req() req: Request) {
    return this.twoFaService.twoFAOff(req["user"]);
  }

  @ApiResponse({ schema: { type: "object", properties: { message: { type: "string" } } } })
  @Post("set")
  twoFa(@Req() req: Request, @Body() dto: ConfirmTwoFACodeDto) {
    return this.twoFaService.confirmSetTwoFACode(req["user"], dto);
  }
}
