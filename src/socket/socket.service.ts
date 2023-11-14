import { WsException } from "@nestjs/websockets";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Socket } from "socket.io";
import { IAuthPayload } from "src/auth/auth.guard";
import { ConvertService } from "src/convert/convert.service";
import { User, UserDocument } from "src/user/schemas/user.schema";
import { BetDto } from "./dto/bet.dto";
import { Bet, IBet } from "src/user/schemas/bet.schema";
import { CashOutDto } from "./dto/cashOut.dto";

const STOP_DISABLE_MS = 2000;
const LOADING_MS = 5000;
const MAX_COEFF = 110;

function sleep(ms: number = 0) {
  return new Promise(res => setTimeout(res, ms));
}

function random(min: number, max: number) {
  return Math.random() * (max - min) + min;
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
  private random = random(0, MAX_COEFF);
  // Algorithm 1
  private threePlayers: UserDocument[] = [];

  // Algorithm 2
  private totalAmount: number = 0;
  private maxWinAmount: number = 0;

  handleConnection(socket: Socket): void {}

  handleDisconnect(socket: Socket): void {}

  handleStartGame() {
    this.interval = setInterval(() => this.game(), 20);
  }

  async game() {
    this.step += 0.0006;
    this.x += this.step;
    if (this.x > this.random) {
      await this.loading();
    }

    this.socket.emit("game", this.x.toFixed(2));
  }

  async handleBet(userPayload: IAuthPayload, dto: BetDto) {
    if (this.isBetWait) {
      return new WsException("Ставки сейчас не применяются");
    }

    const user = await this.userModel.findById(userPayload?.id);

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
    const user = await this.userModel.findById(userPayload?.id);

    const betIndex = this.currentPlayers.findIndex((b, i) => {
      return b.player == userPayload?.id && i + 1 == dto.betNumber && !b.win;
    });

    if (betIndex == -1) {
      return new WsException("У вас нет такой ставки");
    }

    const betData = this.currentPlayers[betIndex];
    if (betData.win) {
      return new WsException("Вы уже сняли эту ставку");
    }
    const win = this.x * betData.bet;

    this.currentPlayers[betIndex] = {
      ...betData,
      win,
      coeff: this.x,
    };

    user.balance += win;
    await user.save();

    //1. 3 player algorithm in Cash Out
    if (true) {
      this.threePlayers = this.threePlayers.filter(u => u._id !== user._id);
      if (!this.threePlayers.length) {
        this.loading();
      }
    }

    // 2. Net income algorithm
    if (true) {
      const totalWinAmount = this.currentPlayers.reduce((prev, next) => prev + next.win, 0);
      if (totalWinAmount >= this.maxWinAmount) {
        this.loading();
      }
    }

    return { message: "Вы выиграли" };
  }

  private async loading() {
    this.x = 1;
    this.step = 0.0006;
    this.random = random(0, MAX_COEFF);
    console.log(this.random);

    clearInterval(this.interval);

    this.socket.emit("disableStop");

    await this.betModel.create(this.currentPlayers);

    this.currentPlayers = [];
    this.threePlayers = [];

    //1. 3 player algorithm loading
    if (true) {
      const count = await this.userModel.count();
      const randomCount = random(0, count);
      this.threePlayers = await this.userModel.find().skip(randomCount).limit(3);
    }

    await sleep(STOP_DISABLE_MS);

    this.isBetWait = false;

    this.socket.emit("loading");

    await sleep(LOADING_MS);

    // 2. Net income algorithm loading
    if (true) {
      this.totalAmount = this.currentPlayers.reduce((prev, curr) => prev + curr.bet, 0);
      this.maxWinAmount = (this.totalAmount * random(30, 100)) / 100;
    }

    this.interval = setInterval(() => this.game(), 100);
  }
}
