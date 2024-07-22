import { WebSocketGateway, SubscribeMessage, MessageBody, OnGatewayConnection, WebSocketServer, OnGatewayInit, OnGatewayDisconnect, ConnectedSocket } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { SocketService } from "./socket.service";
import { UseFilters, UseGuards, UsePipes, ValidationPipe } from "@nestjs/common";
import { SocketAuthGuard } from "./guard/socketAuth.guard";
import { BetDto } from "./dto/bet.dto";
import { CashOutDto } from "./dto/cashOut.dto";
import { SocketExceptionFilter } from "./socket.exception";
import { SocketAdminAuthGuard } from "./guard/socketAdminAuth.guard";
import { CancelBetDto } from "./dto/cancel-bet.dto";

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
