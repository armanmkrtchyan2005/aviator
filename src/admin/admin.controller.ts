import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { AdminService } from "./admin.service";
import { AdminLoginDto } from "./dto/adminLogin.dto";
import { ApiTags } from "@nestjs/swagger";
import { AdminAuth } from "./decorators/adminAuth.decorator";
import { CreateRequisiteDto } from "./dto/createRequisite.dto";

@ApiTags("Admin")
@Controller("admin")
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Post("/login")
  login(@Body() dto: AdminLoginDto) {
    return this.adminService.login(dto);
  }

  @AdminAuth()
  @Post("/requisites")
  createRequisite(@Body() dto: CreateRequisiteDto) {
    return this.adminService.createRequisite(dto);
  }

  @AdminAuth()
  @Get("/requisites")
  getRequisites() {
    return this.adminService.getRequisites();
  }

  @AdminAuth()
  @Get("/replenishments")
  getRequisite() {
    return this.adminService.getReplenishments();
  }

  @AdminAuth()
  @Get("/replenishments/:id")
  confirmReplenishment(@Param("id") id: string) {
    return this.adminService.confirmReplenishment(id);
  }
}
