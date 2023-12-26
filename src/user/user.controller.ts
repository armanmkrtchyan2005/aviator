import { UserService } from "./user.service";
import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  Query,
  Req,
  Session,
  HttpCode,
  Put,
  Param,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  FileTypeValidator,
} from "@nestjs/common";
import { Request } from "express";
import { Auth } from "src/auth/decorators/auth.decorator";
import { ApiBadRequestResponse, ApiBody, ApiConsumes, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { SendCodeDto } from "src/auth/dto/send-code.dto";
import { ConfirmCodeDto } from "src/auth/dto/confirm-code.dto";
import { OldPasswordConfirmDto } from "./dto/old-password-confirm.dto";
import { ChangePasswordDto } from "src/auth/dto/change-password.dto";
import { AddBonusDto } from "./dto/add-bonus.dto";
import { User } from "./schemas/user.schema";
import { MyBalanceResponse } from "./responses/my-balance.response";
import { AddBonusBadResponse, AddBonusResponse } from "./responses/add-bonus.response";
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
import { diskStorage } from "multer";
import { extname } from "path";

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

  @ApiOkResponse({ type: MyBalanceResponse })
  @Get("/balance")
  myBalance(@Req() req: Request) {
    return this.userService.myBalance(req["user"]);
  }

  @ApiOkResponse({ type: AddBonusResponse })
  @ApiBadRequestResponse({ type: AddBonusBadResponse })
  @Post("/bonus")
  addBonus(@Req() req: Request, @Body() dto: AddBonusDto) {
    return this.userService.addBonus(dto, req["user"]);
  }

  @ApiOkResponse({ type: Bonus })
  @Get("/bonus")
  getBonuses(@Req() req: Request) {
    return this.userService.getBonuses(req["user"]);
  }

  @ApiOkResponse({ type: ConfirmEmailSendCodeResponse })
  @HttpCode(HttpStatus.OK)
  @Post("confirm-email/send-code")
  confirmEmailSendCode(@Req() req: Request) {
    return this.userService.confirmEmailSendCode(req.session, req["user"]);
  }

  @ApiOkResponse({ type: ConfirmEmailConfirmCodeResponse })
  @ApiBadRequestResponse({ type: ConfirmEmailConfirmCodeBadResponse })
  @HttpCode(HttpStatus.OK)
  @Post("confirm-email")
  confirmEmailConfirmCode(@Session() session: Record<string, any>, @Body() dto: ConfirmCodeDto) {
    return this.userService.confirmEmailConfirmCode(dto, session);
  }

  @ApiOkResponse({ type: ConfirmEmailSendCodeResponse })
  @HttpCode(HttpStatus.OK)
  @Post("change-email/send-code")
  confirm(@Req() req: Request, @Body() dto: SendCodeDto) {
    return this.userService.changeEmailSendCode(dto, req.session, req["user"]);
  }

  @ApiOkResponse({ type: ChangeEmailConfirmCodeResponse })
  @ApiBadRequestResponse({ type: ConfirmEmailConfirmCodeBadResponse })
  @HttpCode(HttpStatus.OK)
  @Put("change-email")
  confirmCode(@Session() session: Record<string, any>, @Body() dto: ConfirmCodeDto) {
    return this.userService.changeEmailConfirmCode(dto, session);
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
  findRequisites() {
    return this.userService.findRequisites();
  }

  @ApiOkResponse({ type: Requisite })
  @HttpCode(HttpStatus.OK)
  @Get("/requisites/recommended")
  findRecommendedRequisites(@Req() req: Request) {
    return this.userService.findRecommendedRequisites(req["user"]);
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
  @Put("/profile-image")
  @UseInterceptors(
    FileInterceptor("file", {
      storage: diskStorage({
        destination: "./uploads/profile-images",
        filename: (req, file, callback) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join("");
          return callback(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async uploadProfileImage(
    @Req() req: Request,
    @UploadedFile(
      new ParseFilePipe({
        validators: [new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/ })],
        fileIsRequired: true,
      }),
    )
    file: Express.Multer.File,
  ) {
    const imagePath = file.path;
    return this.userService.updateProfileImage(req["user"], imagePath);
  }
}
