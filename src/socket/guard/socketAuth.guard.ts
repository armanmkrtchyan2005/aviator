import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { WsException } from "@nestjs/websockets";
import { Model } from "mongoose";
import { Socket } from "socket.io";
import { Session } from "src/user/schemas/session.schema";

@Injectable()
export class SocketAuthGuard implements CanActivate {
  constructor(@InjectModel(Session.name) private sessionModel: Model<Session>) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client = context.switchToWs().getClient<Socket>();

      const handshake = client.handshake;
      const token = handshake.auth?.token as string | undefined;

      if (!token) {
        throw new WsException("Пользователь не авторизован");
      }

      try {
        const { user } = await this.sessionModel.findOne({ token });

        client["user"] = { id: user };
      } catch {
        throw new WsException("Пользователь не авторизован");
      }
      return true;
    } catch (error) {
      throw new WsException("Пользователь не авторизован");
    }
  }
}
