import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Request } from "express";
import { Model } from "mongoose";
import { Session } from "src/user/schemas/session.schema";

// export interface IAuthPayload extends JwtPayload {
//   id: string;
//   isAdmin?: boolean;
// }

export type IAuthPayload<T = string> = {
  id: T;
  isAdmin?: boolean;
};

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(@InjectModel(Session.name) private sessionModel: Model<Session>) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException();
    }
    try {
      const { user } = await this.sessionModel.findOne({ token });

      request["user"] = { id: user };
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
