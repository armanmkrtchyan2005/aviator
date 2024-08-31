import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Request } from "express";
import { JwtPayload } from "jsonwebtoken";
import { Model } from "mongoose";
import { AccountSession } from "./schemas/account-session.schema";

interface IAdminAuthPayload extends JwtPayload {
  id: number;
}

@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(@InjectModel(AccountSession.name) private accountSession: Model<AccountSession>) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException();
    }
    try {
      const { account } = await this.accountSession.findOne({ token }).populate("account", { password: false });

      request["admin"] = account;
    } catch {
      throw new UnauthorizedException();
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(" ") ?? [];
    return type === "Bearer" ? token : undefined;
  }
}
