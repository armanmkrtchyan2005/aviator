import { Controller, Get, Post, Body, Param, Req, Put, UseInterceptors, UploadedFile, ParseFilePipe, FileTypeValidator, MaxFileSizeValidator } from "@nestjs/common";
import { ReplenishmentService } from "./replenishment.service";
import { CreateReplenishmentDto } from "./dto/create-replenishment.dto";
import { Auth } from "src/auth/decorators/auth.decorator";
import { Request } from "express";
import { CancelReplenishmentDto } from "./dto/cancel-replenishment.dto";
import { ApiBadRequestResponse, ApiBody, ApiConsumes, ApiCreatedResponse, ApiOkResponse, ApiTags, getSchemaPath } from "@nestjs/swagger";
import { Replenishment } from "./schemas/replenishment.schema";
import { CancelReplenishmentBadResponse, CancelReplenishmentResponse, ConfirmReplenishmentResponse } from "./responses/replenishment.response";
import { LimitsOkResponse } from "./responses/limits.response";
import { CommissionOkResponse } from "./responses/commission.response";
import { FileInterceptor } from "@nestjs/platform-express";

const MAX_FILE_SIZE = 1024 * 1024 * 3; // 3mb

@Auth()
@ApiTags("Replenishments")
@Controller("replenishments")
export class ReplenishmentController {
  constructor(private readonly replenishmentService: ReplenishmentService) {}

  @ApiOkResponse({
    type: LimitsOkResponse,
  })
  @Get("/limits/:id")
  findLimits(@Param("id") id: string, @Req() req: Request) {
    return this.replenishmentService.findLimits(req["user"], id);
  }

  @ApiOkResponse({ type: CommissionOkResponse })
  @Get("/commission")
  findCommission(@Req() req: Request) {
    return this.replenishmentService.commission(req["user"]);
  }

  @ApiOkResponse({ type: [Replenishment] })
  @Get("/")
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

  @ApiCreatedResponse({
    type: Replenishment,
  })
  @Post("/")
  create(@Req() req: Request, @Body() dto: CreateReplenishmentDto) {
    return this.replenishmentService.createReplenishment(req["user"], dto);
  }

  @ApiOkResponse({ type: CancelReplenishmentResponse })
  @ApiBadRequestResponse({ type: CancelReplenishmentBadResponse })
  @Put("/cancel/:id")
  cancel(@Param() dto: CancelReplenishmentDto) {
    return this.replenishmentService.cancelReplenishment(dto);
  }

  @ApiOkResponse({ type: ConfirmReplenishmentResponse })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        receipt: {
          type: "string",
          format: "binary",
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor("receipt"))
  @Put("/confirm/:id")
  async confirm(
    @Param("id") id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp|pdf)$/ }), new MaxFileSizeValidator({ maxSize: MAX_FILE_SIZE })],
        fileIsRequired: false,
      }),
    )
    receiptFile: Express.Multer.File,
  ) {
    return this.replenishmentService.confirmReplenishment(id, receiptFile);
  }

  @ApiOkResponse({ schema: { type: "object", properties: { message: { type: "string" } } } })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        card: {
          type: "string",
          format: "binary",
        },
      },
    },
    required: false,
  })
  @UseInterceptors(FileInterceptor("card"))
  @Put("/verify/:id")
  async verify(
    @Param("id") id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [new FileTypeValidator({ fileType: /(jpg|jpeg|heic|png|webp|pdf)$/ }), new MaxFileSizeValidator({ maxSize: MAX_FILE_SIZE })],
        fileIsRequired: false,
      }),
    )
    cardFile: Express.Multer.File,
  ) {
    return this.replenishmentService.verifyReplenishment(id, cardFile);
  }
}
