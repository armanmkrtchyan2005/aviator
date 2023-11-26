import { UserService } from "./user.service";
import { Controller, Get, Req } from "@nestjs/common";
import { Request } from "express";
import { Auth } from "src/auth/decorators/auth.decorator";

@Controller("user")
export class UserController {
  constructor(private userService: UserService) {}
  @Get("/me")
  @Auth()
  findMe(@Req() req: Request) {
    return this.userService.findMe(req["user"]);
  }
}
