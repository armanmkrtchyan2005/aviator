import { BadGatewayException, CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectModel } from "@nestjs/mongoose";
import { WsException } from "@nestjs/websockets";
import { Model } from "mongoose";
import { Socket } from "socket.io";
import { Session } from "src/user/schemas/session.schema";

@Injectable()
export class SocketAdminAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client = context.switchToWs().getClient<Socket>();

      const handshake = client.handshake;
      const token = handshake.auth?.token as string | undefined;

      if (!token) {
        throw new WsException("Пользователь не авторизован");
      }

      try {
        const adminPayload = this.jwtService.verify<{ isAdmin: boolean }>(token);
        if (!adminPayload?.isAdmin) {
          throw new WsException("Пользователь не авторизован");
        }
      } catch {
        throw new WsException("Пользователь не авторизован");
      }
      return true;
    } catch (error) {
      throw new WsException("Пользователь не авторизован");
    }
  }
}
