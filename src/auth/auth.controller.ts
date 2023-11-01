import { Body, Controller, Post, Req, Session } from "@nestjs/common";
import { signUpDto } from "./dto/sign-up.dto";
import { AuthService } from "./auth.service";
import { SignInDto } from "./dto/sign-in.dto";
import { SendCodeDto } from "./dto/send-code.dto";
import { ConfirmCodeDto } from "./dto/confirm-code.dto";

@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post("registration")
  signUp(@Body() dto: signUpDto) {
    return this.authService.signUp(dto);
  }

  @Post("login")
  signIn(@Body() dto: SignInDto) {
    return this.authService.signIn(dto);
  }

  @Post("forgot/send-code")
  sendCode(@Body() dto: SendCodeDto, @Session() session: Record<string, any>) {
    return this.authService.sendCode(dto, session);
  }

  @Post("forgot/confirm-code")
  confirmCode(@Body() dto: ConfirmCodeDto, @Session() session: Record<string, any>) {
    return this.authService.confirmCode(dto, session);
  }
}
