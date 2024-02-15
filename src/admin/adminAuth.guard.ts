import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { JwtPayload } from "jsonwebtoken";
import { Request } from "express";
import { InjectModel } from "@nestjs/mongoose";
import { Admin } from "./schemas/admin.schema";
import { Model } from "mongoose";
import { Account } from "./schemas/account.schema";

interface IAdminAuthPayload extends JwtPayload {
  id: number;
}

@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(@InjectModel(Account.name) private accountModel: Model<Account>, private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException();
    }
    try {
      const payload = await this.jwtService.verifyAsync<IAdminAuthPayload>(token, {
        secret: process.env.JWT_SECRET,
      });

      const admin = await this.accountModel.findById(payload.id);

      if (!admin) {
        throw new UnauthorizedException();
      }

      request["admin"] = admin;
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
