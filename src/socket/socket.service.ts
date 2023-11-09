import { WsException } from "@nestjs/websockets";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Socket } from "socket.io";
import { IAuthPayload } from "src/auth/auth.guard";
import { ConvertService } from "src/convert/convert.service";
import { User } from "src/user/schemas/user.schema";
import { BetDto } from "./dto/bet.dto";

function sleep(ms: number = 0) {
  return new Promise(res => setTimeout(res, ms));
}

@Injectable()
export class SocketService {
  constructor(@InjectModel(User.name) private userModel: Model<User>, private convertService: ConvertService) {}
  private currentPlayers = [];
  public socket: Socket = null;

  private x = 1;
  private step = 0.0006;
  private isBetWait = true;

  private interval: string | number | NodeJS.Timeout;
  private random = Math.floor(Math.random() * 100);

  handleConnection(socket: Socket): void {
    socket.on("disconnect", () => {});
  }

  handleStartGame() {
    this.interval = setInterval(() => this.game(), 100);
  }

  async game() {
    this.step += 0.0006;
    this.x += this.step;

    if (this.x > this.random) {
      await this.loading();
    }

    this.socket.emit("game", this.x.toFixed(2));
  }

  async loading() {
    this.x = 1;
    this.step = 0.0006;
    this.random = Math.floor(Math.random() * 100);
    clearInterval(this.interval);

    this.socket.emit("disableStop");

    await sleep(2000);
    this.isBetWait = false;

    this.socket.emit("loading");

    await sleep(5000);

    this.interval = setInterval(() => this.game(), 100);
  }

  async handleBet(userPayload: IAuthPayload, dto: BetDto) {
    if (this.isBetWait) {
      throw new WsException("Ставки сейчас не применяются");
    }

    const user = await this.userModel.findById(userPayload.id);

    const currency = await this.convertService.convert(user.currency, dto.currency, dto.bet);

    if (currency > user.balance) {
      throw new WsException("Недостаточный баланс");
    }

    const player = {};

    return user.balance;
  }
}
