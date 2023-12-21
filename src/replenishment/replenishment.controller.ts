import { Controller, Get, Post, Body, Param, Req, Put } from "@nestjs/common";
import { ReplenishmentService } from "./replenishment.service";
import { CreateReplenishmentDto } from "./dto/create-replenishment.dto";
import { Auth } from "src/auth/decorators/auth.decorator";
import { Request } from "express";
import { CancelReplenishmentDto } from "./dto/cancel-replenishment.dto";
import { ConfirmReplenishmentDto } from "./dto/confirm-replenishment.dto";
import { ApiOkResponse, ApiTags, getSchemaPath } from "@nestjs/swagger";
import { Replenishment } from "./schemas/replenishment.schema";

@Auth()
@ApiTags("Replenishments")
@Controller("replenishments")
export class ReplenishmentController {
  constructor(private readonly replenishmentService: ReplenishmentService) {}

  @Get("/")
  @ApiOkResponse({ type: [Replenishment] })
  findAll(@Req() req: Request) {
    return this.replenishmentService.findAll(req["user"]);
  }

  @ApiOkResponse({
    type: Replenishment,
  })
  @Get("/:id")
  findOne(@Param("id") id: string) {
    return this.replenishmentService.findOne(id);
  }

  @Post("/")
  create(@Req() req: Request, @Body() dto: CreateReplenishmentDto) {
    return this.replenishmentService.createReplenishment(req["user"], dto);
  }

  @Put("/cancel/:id")
  cancel(@Param() dto: CancelReplenishmentDto) {
    return this.replenishmentService.cancelReplenishment(dto);
  }

  @Put("/confirm/:id")
  confirm(@Param() dto: ConfirmReplenishmentDto) {
    return this.replenishmentService.confirmReplenishment(dto);
  }
}
