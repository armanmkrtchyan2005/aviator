import { BadGatewayException, CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { WsException } from "@nestjs/websockets";
import { Socket } from "socket.io";

@Injectable()
export class SocketAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client = context.switchToWs().getClient<Socket>();

      const handshake = client.handshake;
      const token = handshake.auth?.token as string | undefined;

      if (!token) {
        throw new WsException("Пользователь не авторизован");
      }

      const payload = await this.jwtService.verifyAsync(token, {});

      client["user"] = payload;

      return true;
    } catch (error) {
      throw new WsException("Пользователь не авторизован");
    }
  }
}
