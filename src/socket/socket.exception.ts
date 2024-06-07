import { Catch, ArgumentsHost } from "@nestjs/common";
import { BaseWsExceptionFilter, WsException } from "@nestjs/websockets";
import { Server } from "socket.io";

@Catch()
export class SocketExceptionFilter extends BaseWsExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const client = host.switchToWs().getClient() as Server;
    const error = exception instanceof WsException ? exception.getError() : "Internal server error";

    client.emit("error", { message: error });
  }
}
