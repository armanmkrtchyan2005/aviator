import { UseGuards, applyDecorators } from "@nestjs/common";
import { ApiBearerAuth, ApiUnauthorizedResponse } from "@nestjs/swagger";
import { AdminAuthGuard } from "../adminAuth.guard";

export function AdminAuth() {
  return applyDecorators(UseGuards(AdminAuthGuard), ApiBearerAuth(), ApiUnauthorizedResponse({ description: "Unauthorized" }));
}
