import { UseFilters, UseGuards } from "@nestjs/common";
import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { BetDto } from "./dto/bet.dto";
import { CancelBetDto } from "./dto/cancel-bet.dto";
import { CashOutDto } from "./dto/cashOut.dto";
import { SocketAdminAuthGuard } from "./guard/socketAdminAuth.guard";
import { SocketAuthGuard } from "./guard/socketAuth.guard";
import { SocketExceptionFilter } from "./socket.exception";
import { SocketService } from "./socket.service";

@WebSocketGateway({ cors: { origin: "*" } })
@UseFilters(SocketExceptionFilter)
export class SocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() public server: Server;

  constructor(private readonly socketService: SocketService) {}

  afterInit(server: any) {
    this.socketService.socket = server;
    this.socketService.init();
  }

  handleConnection(client: Socket) {
    this.socketService.handleConnection(client);
  }

  handleDisconnect(client: any) {
    this.socketService.handleDisconnect(client);
  }

  @UseGuards(SocketAuthGuard)
  @SubscribeMessage("bet")
  handleBet(@ConnectedSocket() client: Socket, @MessageBody() dto: BetDto) {
    return this.socketService.handleBet(client["user"], dto);
  }

  @UseGuards(SocketAuthGuard)
  @SubscribeMessage("cancel")
  handleCancel(@ConnectedSocket() client: Socket, @MessageBody() dto: CancelBetDto) {
    return this.socketService.handleCancel(client["user"], dto);
  }

  @UseGuards(SocketAuthGuard)
  @SubscribeMessage("cash-out")
  handleCashOut(@ConnectedSocket() client: Socket, @MessageBody() dto: CashOutDto) {
    return this.socketService.handleCashOut(client["user"], dto);
  }

  @UseGuards(SocketAdminAuthGuard)
  @SubscribeMessage("drain")
  handleDrain() {
    return this.socketService.handleDrain();
  }

  @UseGuards(SocketAdminAuthGuard)
  @SubscribeMessage("start-game")
  handlePlayGame() {
    return this.socketService.handlePlayGame();
  }
}
