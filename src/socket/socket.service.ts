// 4.  -----------------------------?
// 10. -----------------------------?

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
import * as _ from "lodash";

const STOP_DISABLE_MS = 2000;
const LOADING_MS = 5000;
const MAX_COEFF = 110;
const HOUR_IN_MS = 1000 * 60 * 60;

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
  private random = _.random(MAX_COEFF, true);
  // Algorithm 1
  private threePlayers: IBet[] = [];

  // Algorithm 2, Algorithm 8
  private maxWinAmount: number = 0;

  // Algorithm 7
  private totalWinsCount: number = 0;

  // Algorithm 9
  private randomCoeffs = [1, 1.2, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];

  handleConnection(socket: Socket): void {}

  handleDisconnect(socket: Socket): void {}

  randomOneHourAlgorithm() {
    const daley = _.random(HOUR_IN_MS, 2 * HOUR_IN_MS);
    setTimeout(() => {
      this.random = _.random(1, 100, true);
      this.randomOneHourAlgorithm();
    }, daley);
  }

  handleStartGame() {
    this.interval = setInterval(() => this.game(), 20);
    // 6. random one hour algorithm
    this.randomOneHourAlgorithm();
  }

  async game() {
    this.x += this.step;
    this.step += 0.0006;
    // console.log(this.x);

    // 4. -?

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
      this.threePlayers = this.threePlayers.filter(u => u.player !== userPayload?.id);
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

    // 7. Bet counts algorithm
    if (false) {
      const winsCount = this.currentPlayers.filter(bet => {
        return bet.win;
      }).length;

      if (winsCount >= this.totalWinsCount) {
        this.loading();
      }
    }

    // 8. -------------

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
    this.random = _.random(MAX_COEFF, true);

    clearInterval(this.interval);

    this.socket.emit("disableStop");

    await this.betModel.create(this.currentPlayers);

    this.currentPlayers = [];
    this.threePlayers = [];

    await sleep(STOP_DISABLE_MS);

    this.isBetWait = false;

    this.socket.emit("loading");

    await sleep(LOADING_MS);

    //1. 3 player algorithm loading
    if (true) {
      this.threePlayers = _.sampleSize(this.threePlayers, 3);
      this.random = _.random(110, true);
    }

    // 2. Net income algorithm loading
    if (true) {
      const totalAmount = this.currentPlayers.reduce((prev, curr) => prev + curr.bet, 0);
      this.maxWinAmount = (totalAmount * _.random(30, 100, true)) / 100;
    }

    // 3. 1-3 Coeff algorithm
    if (true) {
      this.random = _.random(1, 3);
    }

    // 5. 1-2 Coeff algorithm
    if (false) {
      this.random = _.random(1, 2, true);
    }

    // 7. Bet counts algorithm
    if (false) {
      this.random = _.random(5, 10, true);
      this.totalWinsCount = (this.currentPlayers.length * _.random(20, 70, true)) / 100;
    }

    // 8. --------
    if (false) {
      const range = _.random(1, 3, true);
      const totalAmount = this.currentPlayers.reduce((prev, curr) => prev + curr.bet, 0);
      this.maxWinAmount = totalAmount * range;
    }

    // 9. ---------
    if (true) {
      const randomCoeff = _.sample(this.randomCoeffs);
      this.random = _.random(randomCoeff - 0.2, randomCoeff - 0.01);
    }

    this.interval = setInterval(() => this.game(), 100);
  }
}
