import { WebSocketGateway, SubscribeMessage, MessageBody, OnGatewayConnection, WebSocketServer, OnGatewayInit, OnGatewayDisconnect, ConnectedSocket } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { SocketService } from "./socket.service";
import { UseFilters, UseGuards, UsePipes, ValidationPipe } from "@nestjs/common";
import { SocketAuthGuard } from "./socketAuth.guard";
import { BetDto } from "./dto/bet.dto";
import { CashOutDto } from "./dto/cashOut.dto";
import { SocketExceptionsFilter } from "./socket.exception";
import { ApiTags } from "@nestjs/swagger";

@WebSocketGateway({ cors: true })
@UseFilters(SocketExceptionsFilter)
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
  handleBet(@ConnectedSocket() client: Socket, @MessageBody() dto: BetDto) {
    return this.socketService.handleBet(client["user"], dto);
  }

  @UseGuards(SocketAuthGuard)
  @SubscribeMessage("cash-out")
  handleCashOut(@ConnectedSocket() client: Socket, @MessageBody() dto: CashOutDto) {
    return this.socketService.handleCashOut(client["user"], dto);
  }
}
