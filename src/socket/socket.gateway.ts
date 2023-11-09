import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  OnGatewayConnection,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayDisconnect,
  WsException,
  ConnectedSocket,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { SocketService } from "./socket.service";
import { UseGuards, UsePipes, ValidationPipe } from "@nestjs/common";
import { SocketAuthGuard } from "./socketAuth.guard";
import { BetDto } from "./dto/bet.dto";

@UsePipes(
  new ValidationPipe({
    stopAtFirstError: true,
    exceptionFactory(validationErrors = []) {
      if (this.isDetailedOutputDisabled) {
        return new WsException("Bad request");
      }
      const errors = this.flattenValidationErrors(validationErrors);

      return new WsException(errors);
    },
  }),
)
@WebSocketGateway({ cors: true })
export class SocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() public server: Server;

  constructor(private readonly socketService: SocketService) {}

  afterInit(server: any) {
    this.socketService.socket = server;
    this.socketService.handleStartGame();
  }

  handleConnection(socket: Socket): void {
    this.socketService.handleConnection(socket);
  }

  handleDisconnect(client: any) {}

  @UseGuards(SocketAuthGuard)
  @SubscribeMessage("bet")
  handleBet(@MessageBody() dto: BetDto, @ConnectedSocket() client: Socket) {
    return this.socketService.handleBet(client["user"], dto);
  }
}
