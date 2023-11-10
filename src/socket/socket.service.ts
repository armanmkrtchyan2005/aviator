import { WsException } from "@nestjs/websockets";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Socket } from "socket.io";
import { IAuthPayload } from "src/auth/auth.guard";
import { ConvertService } from "src/convert/convert.service";
import { User } from "src/user/schemas/user.schema";
import { BetDto } from "./dto/bet.dto";
import { Bet, IBet } from "src/user/schemas/bet.schema";
import { CashOutDto } from "./dto/cashOut.dto";

const STOP_DISABLE_MS = 2000;
const LOADING_MS = 5000;

function sleep(ms: number = 0) {
  return new Promise(res => setTimeout(res, ms));
}

@Injectable()
export class SocketService {
  constructor(@InjectModel(User.name) private userModel: Model<User>, @InjectModel(Bet.name) private betModel: Model<Bet>, private convertService: ConvertService) {}
  private currentPlayers: IBet[] = [];
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

    await this.betModel.create(this.currentPlayers);

    this.currentPlayers = [];

    await sleep(STOP_DISABLE_MS);

    this.isBetWait = false;

    this.socket.emit("loading");

    await sleep(LOADING_MS);

    this.interval = setInterval(() => this.game(), 100);
  }

  async handleBet(userPayload: IAuthPayload, dto: BetDto) {
    if (this.isBetWait) {
      return new WsException("Ставки сейчас не применяются");
    }

    const user = await this.userModel.findById(userPayload.id);

    if (!user) {
      return new WsException("Пользователь не авторизован");
    }

    const bet = await this.convertService.convert(user.currency, dto.currency, dto.bet);

    if (bet > user.balance) {
      return new WsException("Недостаточный баланс");
    }
    user.balance -= bet;

    await user.save();

    this.currentPlayers.push({ player: userPayload.id, currency: user.currency, bet, time: new Date() });

    return { message: "Ставка сделана" };
  }

  async handleCashOut(userPayload: IAuthPayload, dto: CashOutDto) {
    const user = await this.userModel.findById(userPayload.id);
    const betIndex = this.currentPlayers.findIndex((b, i) => {
      return b.player == userPayload.id && i + 1 == dto.betNumber && !b.win;
    });

    const betData = this.currentPlayers[betIndex];

    const win = this.x * betData.bet;

    this.currentPlayers[betIndex] = {
      ...betData,
      win,
      coeff: this.x,
    };

    user.balance += win;
    await user.save();
  }
}
