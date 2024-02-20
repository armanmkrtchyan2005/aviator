import { Request } from "express";
import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Put, Query, Req } from "@nestjs/common";
import { AdminService } from "./admin.service";
import { AdminLoginDto } from "./dto/adminLogin.dto";
import { ApiBadRequestResponse, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { AdminAuth } from "./decorators/adminAuth.decorator";
import { CreateRequisiteDto } from "./dto/createRequisite.dto";
import { SignInOkResponse } from "src/auth/responses/sign-in.response";
import { ConfirmReplenishmentBadResponse, ConfirmReplenishmentResponse, CreateRequisiteBadResponse } from "./responses/requisite.response";
import { Requisite } from "./schemas/requisite.schema";
import { Replenishment } from "src/replenishment/schemas/replenishment.schema";
import { CancelReplenishmentDto } from "./dto/cancelReplenishment.dto";
import { Withdrawal } from "src/withdrawal/schemas/withdrawal.schema";
import { CancelReplenishmentBadResponse, CancelReplenishmentResponse } from "src/replenishment/responses/replenishment.response";
import { CancelWithdrawalBadResponse, CancelWithdrawalOkResponse } from "src/withdrawal/responses/cancelWithdrawal.response";
import { LimitQueryDto } from "./dto/limit-query.dto";

@ApiTags("Admin")
@Controller("admin")
export class AdminController {
  constructor(private adminService: AdminService) {}

  @AdminAuth()
  @ApiOkResponse({ type: Requisite })
  @Get("/")
  adminDetails(@Req() req: Request) {
    return this.adminService.adminDetails(req["admin"]);
  }

  @ApiOkResponse({ type: SignInOkResponse })
  @HttpCode(HttpStatus.OK)
  @Post("/login")
  login(@Body() dto: AdminLoginDto) {
    return this.adminService.login(dto);
  }

  @AdminAuth()
  @ApiOkResponse({ type: Requisite })
  @ApiBadRequestResponse({ type: CreateRequisiteBadResponse })
  @Post("/requisites")
  createRequisite(@Body() dto: CreateRequisiteDto) {
    return this.adminService.createRequisite(dto);
  }

  @AdminAuth()
  @ApiOkResponse({ type: Requisite })
  @Get("/requisites")
  getRequisites() {
    return this.adminService.getRequisites();
  }

  @AdminAuth()
  @ApiOkResponse({ type: Replenishment })
  @Get("/replenishments")
  getRequisite(@Req() req: Request, @Query() dto: LimitQueryDto) {
    return this.adminService.getReplenishments(req["admin"], dto);
  }

  @AdminAuth()
  @ApiOkResponse({ type: ConfirmReplenishmentResponse })
  @ApiBadRequestResponse({ type: ConfirmReplenishmentBadResponse })
  @Put("/replenishments/:id")
  confirmReplenishment(@Req() req: Request, @Param("id") id: string) {
    return this.adminService.confirmReplenishment(req["admin"], id);
  }

  @AdminAuth()
  @ApiOkResponse({ type: CancelReplenishmentResponse })
  @ApiBadRequestResponse({ type: CancelReplenishmentBadResponse })
  @Put("/replenishments/:id/cancel")
  cancelReplenishment(@Req() req: Request, @Param("id") id: string, @Body() dto: CancelReplenishmentDto) {
    return this.adminService.cancelReplenishment(req["admin"], id, dto);
  }

  @AdminAuth()
  @ApiOkResponse({ type: Withdrawal })
  @Get("/withdrawals")
  getWithdrawals(@Req() req: Request, @Query() dto: LimitQueryDto) {
    return this.adminService.getWithdrawals(req["admin"], dto);
  }

  @AdminAuth()
  @ApiOkResponse({ schema: { type: "object", properties: { message: { type: "string" } } } })
  @Put("/withdrawals/:id/activate")
  activateWithdrawal(@Req() req: Request, @Param("id") id: string) {
    return this.adminService.activateWithdrawal(req["admin"], id);
  }

  @AdminAuth()
  @ApiOkResponse({ type: ConfirmReplenishmentResponse })
  @ApiBadRequestResponse({ type: ConfirmReplenishmentBadResponse })
  @Put("/withdrawals/:id")
  confirmWithdrawal(@Req() req: Request, @Param("id") id: string) {
    return this.adminService.confirmWithdrawal(req["admin"], id);
  }

  @AdminAuth()
  @ApiOkResponse({ type: CancelWithdrawalOkResponse })
  @ApiBadRequestResponse({ type: CancelWithdrawalBadResponse })
  @Put("/withdrawals/:id/cancel")
  cancelWithdrawal(@Req() req: Request, @Param("id") id: string, @Body() dto: CancelReplenishmentDto) {
    return this.adminService.cancelWithdrawal(req["admin"], id, dto);
  }
}
