import { Body, Controller, HttpCode, HttpStatus, Param, Post, Put, Query, Req, Session } from "@nestjs/common";
import { SignUpDto } from "./dto/sign-up.dto";
import { AuthService } from "./auth.service";
import { SignInDto } from "./dto/sign-in.dto";
import { SendCodeDto } from "./dto/send-code.dto";
import { ConfirmCodeDto } from "./dto/confirm-code.dto";
import { ApiBadRequestResponse, ApiCreatedResponse, ApiOkResponse, ApiParam, ApiQuery, ApiTags } from "@nestjs/swagger";
import { SignUpBadResponse, SignUpCreatedResponse } from "./responses/sign-up.response";
import { SignInBadResponse, SignInOkResponse } from "./responses/sign-in.response";
import { SendCodeBadResponse, SendCodeOkResponse } from "./responses/send-code.response";
import { ConfirmCodeBadResponse, ConfirmCodeOkResponse } from "./responses/confirm-code.response";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { ChangePasswordBadResponse, ChangePasswordOkResponse } from "./responses/change-password.response";

@ApiTags("Authentication")
@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @ApiCreatedResponse({ description: "User created", type: SignUpCreatedResponse })
  @ApiBadRequestResponse({ description: "User validation errors", type: SignUpBadResponse })
  @HttpCode(HttpStatus.CREATED)
  @Post("registration")
  signUp(@Body() dto: SignUpDto): Promise<SignUpCreatedResponse> {
    return this.authService.signUp(dto);
  }

  @ApiOkResponse({ description: "User successfully logged in", type: SignInOkResponse })
  @ApiBadRequestResponse({ description: "Login or password is wrong", type: SignInBadResponse })
  @HttpCode(HttpStatus.OK)
  @Post("login")
  signIn(@Body() dto: SignInDto): Promise<SignInOkResponse> {
    return this.authService.signIn(dto);
  }

  @ApiOkResponse({ description: "Code sended to your email", type: SendCodeOkResponse })
  @ApiBadRequestResponse({ description: "User from this email not founded", type: SendCodeBadResponse })
  @HttpCode(HttpStatus.OK)
  @Post("forgot/send-code")
  sendCode(@Body() dto: SendCodeDto): Promise<SendCodeOkResponse> {
    return this.authService.sendCode(dto);
  }

  @ApiOkResponse({ description: "Right code", type: ConfirmCodeOkResponse })
  @ApiBadRequestResponse({ description: "Wrong code", type: ConfirmCodeBadResponse })
  @HttpCode(HttpStatus.OK)
  @Post("forgot/confirm-code")
  confirmCode(@Body() dto: ConfirmCodeDto): Promise<ConfirmCodeOkResponse> {
    return this.authService.confirmCode(dto);
  }

  @ApiOkResponse({ description: "Right code", type: ChangePasswordOkResponse })
  @ApiBadRequestResponse({ description: "Wrong code", type: ChangePasswordBadResponse })
  @ApiParam({ name: "token" })
  @HttpCode(HttpStatus.OK)
  @Put("forgot/change-password/:token")
  changePassword(@Body() dto: ChangePasswordDto, @Param("token") token: string): Promise<ChangePasswordOkResponse> {
    return this.authService.changePassword(dto, token);
  }
}
