import { UserService } from "./user.service";
import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  Query,
  Req,
  HttpCode,
  Put,
  Param,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  FileTypeValidator,
  MaxFileSizeValidator,
} from "@nestjs/common";
import { Request } from "express";
import { Auth } from "src/auth/decorators/auth.decorator";
import { ApiBadRequestResponse, ApiBody, ApiConsumes, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { SendCodeDto } from "src/auth/dto/send-code.dto";
import { ConfirmCodeDto } from "src/auth/dto/confirm-code.dto";
import { OldPasswordConfirmDto } from "./dto/old-password-confirm.dto";
import { ChangePasswordDto } from "src/auth/dto/change-password.dto";
import { AddPromoDto } from "./dto/add-promo.dto";
import { User } from "./schemas/user.schema";
import { MyBalanceResponse } from "./responses/my-balance.response";
import { Bonus } from "./schemas/bonus.schema";
import {
  ChangeEmailConfirmCodeResponse,
  ChangePasswordBadResponse,
  ChangePasswordResponse,
  ConfirmEmailConfirmCodeBadResponse,
  ConfirmEmailConfirmCodeResponse,
  ConfirmEmailSendCodeResponse,
  OldPasswordConfirmBadResponse,
} from "./responses/confirm-email.response";
import { SignInOkResponse } from "src/auth/responses/sign-in.response";
import { FindRequisitesResponse } from "./responses/requisite.response";
import { Requisite } from "src/admin/schemas/requisite.schema";
import { FileInterceptor } from "@nestjs/platform-express";
import { ReferralByDaysOkResponse, ReferralOkResponse } from "./responses/referral.response";
import { FindReferralsByDayDto } from "./dto/findReferralsByDay.dto";
import { GetPromosDto } from "./dto/getPromos.dto";
import { Promo } from "./schemas/promo.schema";
import { GameLimits } from "src/admin/schemas/admin.schema";
import { ProfileImageSharpPipe } from "src/pipes/profile-image-sharp.pipe";
import { RequisiteDto } from "./dto/requisite.dto";
import { ConfirmEmailSendCodeDto } from "./dto/confirm-email-send-code.dto";
import { ConfirmEmailConfirmCode } from "./dto/confirm-email-confirm-code.dto";

const MAX_FILE_SIZE = 1024 * 1024 * 1; // 1mb

@ApiTags("User")
@Auth()
@Controller("user")
export class UserController {
  constructor(private userService: UserService) {}

  @ApiOkResponse({ type: User })
  @Get("/")
  findMe(@Req() req: Request) {
    return this.userService.findMe(req["user"]);
  }

  @ApiOkResponse({
    type: GameLimits,
  })
  @Get("/game-limits")
  findGameLimits(@Req() req: Request) {
    return this.userService.findGameLimits(req["user"]);
  }

  @ApiOkResponse({ type: ReferralOkResponse })
  @Get("/referral")
  referral(@Req() req: Request) {
    return this.userService.referral(req["user"]);
  }

  @ApiOkResponse({ type: ReferralByDaysOkResponse })
  @Get("/referral/by-days")
  findReferralsByDay(@Req() req: Request, @Query() query: FindReferralsByDayDto) {
    return this.userService.findReferralsByDay(req["user"], query);
  }

  @ApiOkResponse({ type: MyBalanceResponse })
  @Get("/balance")
  myBalance(@Req() req: Request) {
    return this.userService.myBalance(req["user"]);
  }

  @ApiOkResponse({ type: Promo })
  @Post("/promos")
  addPromo(@Req() req: Request, @Body() dto: AddPromoDto) {
    return this.userService.addPromo(dto, req["user"]);
  }

  @ApiOkResponse({ type: [Promo] })
  @Get("/promos")
  getPromos(@Query() dto: GetPromosDto, @Req() req: Request) {
    return this.userService.getPromos(dto, req["user"]);
  }

  @ApiOkResponse({ type: Bonus })
  @Get("/promos/:id")
  getPromo(@Req() req: Request, @Param("id") id: string) {
    return this.userService.getPromo(req["user"], id);
  }

  @ApiOkResponse({ type: ConfirmEmailSendCodeResponse })
  @HttpCode(HttpStatus.OK)
  @Post("confirm-email/send-code")
  confirmEmailSendCode(@Req() req: Request, @Body() dto: ConfirmEmailSendCodeDto) {
    return this.userService.confirmEmailSendCode(req["user"], dto);
  }

  @ApiOkResponse({ type: ConfirmEmailConfirmCodeResponse })
  @ApiBadRequestResponse({ type: ConfirmEmailConfirmCodeBadResponse })
  @HttpCode(HttpStatus.OK)
  @Post("confirm-email")
  confirmEmailConfirmCode(@Req() req: Request, @Body() dto: ConfirmEmailConfirmCode) {
    return this.userService.confirmEmailConfirmCode(req["user"], dto);
  }

  @ApiOkResponse({ type: ConfirmEmailSendCodeResponse })
  @HttpCode(HttpStatus.OK)
  @Post("change-email/send-code")
  confirm(@Req() req: Request, @Body() dto: SendCodeDto) {
    return this.userService.changeEmailSendCode(dto, req["user"]);
  }

  @ApiOkResponse({ type: ChangeEmailConfirmCodeResponse })
  @ApiBadRequestResponse({ type: ConfirmEmailConfirmCodeBadResponse })
  @HttpCode(HttpStatus.OK)
  @Put("change-email")
  confirmCode(@Req() req: Request, @Body() dto: ConfirmCodeDto) {
    return this.userService.changeEmailConfirmCode(req["user"], dto);
  }

  @ApiOkResponse({ type: SignInOkResponse })
  @ApiBadRequestResponse({ type: OldPasswordConfirmBadResponse })
  @HttpCode(HttpStatus.OK)
  @Put("password/confirm")
  oldPasswordConfirm(@Req() req: Request, @Body() dto: OldPasswordConfirmDto) {
    return this.userService.oldPasswordConfirm(dto, req["user"]);
  }

  @ApiOkResponse({ type: ChangePasswordResponse })
  @ApiBadRequestResponse({ type: ChangePasswordBadResponse })
  @HttpCode(HttpStatus.OK)
  @Put("password/:token")
  changePassword(@Body() dto: ChangePasswordDto, @Param("token") token: string) {
    return this.userService.changePassword(dto, token);
  }

  @ApiOkResponse({ type: FindRequisitesResponse })
  @HttpCode(HttpStatus.OK)
  @Get("/requisites")
  findRequisites(@Req() req: Request, @Query() dto: RequisiteDto) {
    return this.userService.findRequisites(req["user"], dto);
  }

  @ApiOkResponse({ type: Requisite })
  @HttpCode(HttpStatus.OK)
  @Get("/requisites/recommended")
  findRecommendedRequisites(@Req() req: Request, @Query() dto: RequisiteDto) {
    return this.userService.findRecommendedRequisites(req["user"], dto);
  }

  @ApiOkResponse({ type: User })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        file: {
          type: "string",
          format: "binary",
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor("file"))
  @Put("/profile-image")
  async uploadProfileImage(
    @Req() req: Request,
    @UploadedFile(
      new ParseFilePipe({
        validators: [new FileTypeValidator({ fileType: /(jpg|jpeg|heic|png|webp)$/ }), new MaxFileSizeValidator({ maxSize: MAX_FILE_SIZE })],
        fileIsRequired: true,
      }),
      ProfileImageSharpPipe,
    )
    file: string,
  ) {
    const protocol = req.protocol;
    const host = req.get("Host");
    const origin = protocol + "://" + host + "/";

    return this.userService.updateProfileImage(req["user"], origin, file);
  }
}
