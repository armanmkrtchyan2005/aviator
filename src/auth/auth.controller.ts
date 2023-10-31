import { Body, Controller, Post } from "@nestjs/common";
import { signUpDto } from "./dto/sign-up.dto";
import { AuthService } from "./auth.service";

@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post("registration")
  signUp(@Body() dto: signUpDto) {
    return this.authService.signUp(dto);
  }
}
