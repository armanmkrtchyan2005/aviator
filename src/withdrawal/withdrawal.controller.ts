import { Body, Controller, Get, Param, Post, Put, Req } from "@nestjs/common";
import { ApiBadRequestResponse, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { Auth } from "src/auth/decorators/auth.decorator";
import { WithdrawalService } from "./withdrawal.service";
import { Request } from "express";
import { CreateWithdrawalDto } from "./dto/createWithdrawal.dto";
import { Withdrawal } from "./schemas/withdrawal.schema";
import { CreateWithdrawalBadResponse } from "./responses/createWithdrawal.response";
import { CancelWithdrawalOkResponse } from "./responses/cancelWithdrawal.response";
import { LimitsOkResponse } from "src/replenishment/responses/limits.response";

@ApiTags("Withdrawals")
@Auth()
@Controller("withdrawals")
export class WithdrawalController {
  constructor(private withdrawalService: WithdrawalService) {}

  @ApiOkResponse({
    type: LimitsOkResponse,
  })
  @Get("/limits/:requisiteId")
  getWithdrawalsLimit(@Req() req: Request, @Param("requisiteId") requisiteId: string) {
    return this.withdrawalService.findLimits(req["user"], requisiteId);
  }

  @ApiOkResponse({ type: [Withdrawal] })
  @Get("/")
  getWithdrawals(@Req() req: Request) {
    return this.withdrawalService.findAll(req["user"]);
  }

  @ApiOkResponse({ type: Withdrawal })
  @ApiBadRequestResponse({ type: CreateWithdrawalBadResponse })
  @Post("/")
  createWithdrawal(@Req() req: Request, @Body() dto: CreateWithdrawalDto) {
    return this.withdrawalService.createWithdrawal(req["user"], dto);
  }

  @ApiOkResponse({ type: CancelWithdrawalOkResponse })
  @Put("/:id/cancel")
  cancelWithdrawal(@Param("id") id: string) {
    return this.withdrawalService.cancelWithdrawal(id);
  }
}
