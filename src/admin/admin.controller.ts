import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Put } from "@nestjs/common";
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

@ApiTags("Admin")
@Controller("admin")
export class AdminController {
  constructor(private adminService: AdminService) {}

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
  getRequisite() {
    return this.adminService.getReplenishments();
  }

  @AdminAuth()
  @ApiOkResponse({ type: ConfirmReplenishmentResponse })
  @ApiBadRequestResponse({ type: ConfirmReplenishmentBadResponse })
  @Put("/replenishments/:id")
  confirmReplenishment(@Param("id") id: string) {
    return this.adminService.confirmReplenishment(id);
  }

  @AdminAuth()
  @ApiOkResponse({ type: CancelReplenishmentResponse })
  @ApiBadRequestResponse({ type: CancelReplenishmentBadResponse })
  @Put("/replenishments/:id/cancel")
  cancelReplenishment(@Param("id") id: string, @Body() dto: CancelReplenishmentDto) {
    return this.adminService.cancelReplenishment(id, dto);
  }

  @AdminAuth()
  @ApiOkResponse({ type: Withdrawal })
  @Get("/withdrawals")
  getWithdrawals() {
    return this.adminService.getWithdrawals();
  }

  @AdminAuth()
  @ApiOkResponse({ type: ConfirmReplenishmentResponse })
  @ApiBadRequestResponse({ type: ConfirmReplenishmentBadResponse })
  @Put("/withdrawals/:id")
  confirmWithdrawal(@Param("id") id: string) {
    return this.adminService.confirmWithdrawal(id);
  }

  @AdminAuth()
  @ApiOkResponse({ type: CancelWithdrawalOkResponse })
  @ApiBadRequestResponse({ type: CancelWithdrawalBadResponse })
  @Put("/withdrawals/:id/cancel")
  cancelWithdrawal(@Param("id") id: string, @Body() dto: CancelReplenishmentDto) {
    return this.adminService.cancelWithdrawal(id, dto);
  }
}
