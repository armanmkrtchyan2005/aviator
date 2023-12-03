import { UserService } from "./user.service";
import { Body, Controller, Get, HttpStatus, Post, Query, Req, Session, HttpCode, Put, Param } from "@nestjs/common";
import { Request } from "express";
import { Auth } from "src/auth/decorators/auth.decorator";
import { ApiTags } from "@nestjs/swagger";
import { SendCodeDto } from "src/auth/dto/send-code.dto";
import { ConfirmCodeDto } from "src/auth/dto/confirm-code.dto";
import { OldPasswordConfirmDto } from "./dto/old-password-confirm.dto";
import { ChangePasswordDto } from "src/auth/dto/change-password.dto";
import { AddBonusDto } from "./dto/add-bonus.dto";

@ApiTags("User")
@Auth()
@Controller("user")
export class UserController {
  constructor(private userService: UserService) {}

  @Get("/")
  findMe(@Req() req: Request) {
    return this.userService.findMe(req["user"]);
  }

  @Get("/balance")
  myBalance(@Req() req: Request) {
    return this.userService.myBalance(req["user"]);
  }

  @Post("/bonus")
  addBonus(@Req() req: Request, @Body() dto: AddBonusDto) {
    return this.userService.addBonus(dto, req["user"]);
  }

  @Get("/bonus")
  getBonuses(@Req() req: Request) {
    return this.userService.getBonuses(req["user"]);
  }

  @HttpCode(HttpStatus.OK)
  @Post("confirm-email/send-code")
  confirmEmailSendCode(@Req() req: Request) {
    return this.userService.confirmEmailSendCode(req.session, req["user"]);
  }

  @HttpCode(HttpStatus.OK)
  @Post("confirm-email")
  confirmEmailConfirmCode(@Session() session: Record<string, any>, @Body() dto: ConfirmCodeDto) {
    return this.userService.confirmEmailConfirmCode(dto, session);
  }

  @HttpCode(HttpStatus.OK)
  @Post("change-email/send-code")
  confirm(@Req() req: Request, @Body() dto: SendCodeDto) {
    return this.userService.changeEmailSendCode(dto, req.session, req["user"]);
  }

  @HttpCode(HttpStatus.OK)
  @Put("change-email")
  confirmCode(@Session() session: Record<string, any>, @Body() dto: ConfirmCodeDto) {
    return this.userService.changeEmailConfirmCode(dto, session);
  }

  @HttpCode(HttpStatus.OK)
  @Put("password/confirm")
  oldPasswordConfirm(@Req() req: Request, @Body() dto: OldPasswordConfirmDto) {
    return this.userService.oldPasswordConfirm(dto, req["user"]);
  }

  @HttpCode(HttpStatus.OK)
  @Put("password/:token")
  changePassword(@Body() dto: ChangePasswordDto, @Param("token") token: string) {
    return this.userService.changePassword(dto, token);
  }
}
