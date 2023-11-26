import { Catch, ArgumentsHost, HttpException } from "@nestjs/common";
import { BaseWsExceptionFilter, WsException } from "@nestjs/websockets";
import { Server } from "socket.io";

@Catch(WsException, HttpException)
export class SocketExceptionsFilter extends BaseWsExceptionFilter {
  catch(exception: WsException | HttpException, host: ArgumentsHost) {
    const client = host.switchToWs().getClient() as Server;
    const data = host.switchToWs().getData();
    const error = exception instanceof WsException ? exception.getError() : exception.getResponse();
    const details = error instanceof Object ? { ...error } : { message: error };
    client.send({
      event: "error",
      data: {
        id: (client as any).id,
        rid: data.rid,
        ...details,
      },
    });
  }
}
