import { WsException } from "@nestjs/websockets";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Socket } from "socket.io";
import { IAuthPayload } from "src/auth/auth.guard";
import { ConvertService } from "src/convert/convert.service";
import { User } from "src/user/schemas/user.schema";
import { BetDto } from "./dto/bet.dto";
import { Bet, IBet } from "src/bets/schemas/bet.schema";
import { CashOutDto } from "./dto/cashOut.dto";
import { Admin, IAlgorithms } from "src/admin/schemas/admin.schema";
import { Referral } from "src/user/schemas/referral.schema";
import { UserPromo } from "src/user/schemas/userPromo.schema";
import * as _ from "lodash";
import { Coeff } from "src/bets/schemas/coeff.schema";

const STOP_DISABLE_MS = 2000;
const LOADING_MS = 5000;
const MAX_COEFF = 110;
const HOUR_IN_MS = 1000 * 60 * 60;

function sleep(ms: number = 0) {
  return new Promise(res => setTimeout(res, ms));
}

@Injectable()
export class SocketService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Bet.name) private betModel: Model<Bet>,
    @InjectModel(UserPromo.name) private userPromoModel: Model<UserPromo>,
    @InjectModel(Admin.name) private adminModel: Model<Admin>,
    @InjectModel(Referral.name) private referralModel: Model<Referral>,
    @InjectModel(Coeff.name) private coeffModel: Model<Coeff>,
    private convertService: ConvertService,
  ) {}

  private currentPlayers: IBet[] = [];
  private betAmount = 0;
  private winAmount = 0;

  private algorithms: IAlgorithms[] = [];
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

  // Algorithm 10
  private maxGameCount = _.random(3, 6, false) * 2;
  private playedCount: number = 0;
  private totalWins: number = 0;
  private totalBets: number = 0;
  private partOfProfit: number = 0;

  async handleConnection(client: Socket) {}
  handleDisconnect(socket: Socket): void {}

  private randomOneHourAlgorithm() {
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
    this.x = +this.x.toFixed(2);
    this.step += 0.0006;

    // 4. ----------
    if (this.algorithms[3]?.active) {
      if (this.x > 1.9 && this.x < 2.2) {
        this.threePlayers = _.sampleSize(this.threePlayers, 3);
        this.random = _.random(110, true);
      }
    }

    if (this.x > this.random) {
      return await this.loading();
    }

    this.socket.emit("game", { x: this.x });
  }

  async handleBet(userPayload: IAuthPayload, dto: BetDto) {
    if (this.isBetWait) {
      return new WsException("Ставки сейчас не применяются");
    }

    const user = await this.userModel.findById(userPayload?.id, ["currency", "balance", "bonuses", "login"]);
    const admin = await this.adminModel.findOne({}, ["gameLimits", "algorithms"]);
    if (!user) {
      return new WsException("Пользователь не авторизован");
    }

    const userPromo = await this.userPromoModel.findOne({ user: user._id, promo: dto.promoId, active: false }).populate("promo");

    const minBet = await this.convertService.convert(admin.gameLimits.currency, dto.currency, admin.gameLimits.min);
    const maxBet = await this.convertService.convert(admin.gameLimits.currency, dto.currency, admin.gameLimits.max);

    if (dto.bet < minBet) {
      return new WsException(`Минимальная ставка ${minBet} ${user.currency}`);
    }

    if (dto.bet > maxBet) {
      return new WsException(`Максимальная ставка ${maxBet} ${user.currency}`);
    }

    let bet: number;

    if (!userPromo) {
      bet = await this.convertService.convert(dto.currency, user.currency, dto.bet);

      if (bet > user.balance) {
        return new WsException("Недостаточный баланс");
      }

      user.balance -= bet;

      await user.save();
    } else {
      bet = await this.convertService.convert(userPromo.promo?.currency, user.currency, userPromo.promo.amount);
      userPromo.active = true;
      await userPromo.save();
    }
    const betDataObject: IBet = {
      playerId: userPayload.id,
      playerLogin: user.login,
      currency: user.currency,
      bet,
      promo: userPromo?.promo,
      time: new Date(),
      betNumber: dto.betNumber,
    };
    const betData = await this.betModel.create(betDataObject);
    betDataObject._id = betData._id.toString();

    betDataObject.currency = "USD";
    betDataObject.bet = await this.convertService.convert(user.currency, "USD", bet);

    this.currentPlayers.push(betDataObject);

    const currentPlayers = this.currentPlayers.map(({ _id, playerId, promo, ...bet }) => bet);

    this.betAmount += betDataObject.bet;

    this.socket.emit("currentPlayers", { betAmount: this.betAmount, winAmount: this.winAmount, currentPlayers });

    const algorithms = admin.algorithms.map(algorithm => {
      if (algorithm.active) {
        algorithm.all_bets_amount += betDataObject.bet;
      }

      return algorithm;
    });

    await admin.updateOne({ $set: { algorithms } });

    return { message: "Ставка сделана" };
  }

  async handleCashOut(userPayload: IAuthPayload, dto: CashOutDto) {
    const user = await this.userModel.findById(userPayload.id);

    const betIndex = this.currentPlayers.findIndex(b => {
      return b.playerId == userPayload?.id && dto.betNumber === b.betNumber;
    });

    if (betIndex == -1) {
      return new WsException("У вас нет такой ставки");
    }

    const betData = this.currentPlayers[betIndex];
    if (betData.win) {
      return new WsException("Вы уже сняли эту ставку");
    }

    if (betData.promo && this.x < betData?.promo?.coef) {
      return new WsException(`Вы не можете выиграть до ${betData.promo.coef}x`);
    }

    const x = this.x;
    const betAmount = await this.convertService.convert("USD", user.currency, betData.bet);
    const win = +(x * betAmount).toFixed(2);

    this.currentPlayers[betIndex] = {
      ...betData,
      win: betData.bet * x,
      coeff: x,
    };

    const bet = await this.betModel.findById(betData._id);

    bet.win = win;
    bet.win = x;

    await bet.save();

    this.winAmount += win;

    const currentPlayers = this.currentPlayers.map(({ _id, playerId, promo, ...bet }) => bet);

    this.socket.emit("currentPlayers", { betAmount: this.betAmount, winAmount: this.winAmount, currentPlayers });

    user.balance += win;

    await user.save();

    const leader = await this.userModel.findById(user.leader);

    if (leader) {
      const converted = await this.convertService.convert(user.currency, leader.currency, (user.balance * 40) / 100);

      leader.balance += converted;
      leader.referralBalance += converted;

      const findIndex = leader.descendants.findIndex(i => i._id === user._id.toString());
      const descendant = leader.descendants[findIndex];

      leader.descendants[findIndex] = { ...descendant, earnings: descendant.earnings + converted, updatedUt: new Date() };

      await this.referralModel.create({ earned: converted, currency: leader.currency, createdAt: new Date(), user: leader._id });

      await leader.save();
    }

    const admin = await this.adminModel.findOne({}, ["algorithms"]);

    const algorithms = admin.algorithms.map(algorithm => {
      if (algorithm.active) {
        algorithm.all_withdrawal_amount += win;
      }

      return algorithm;
    });

    await admin.updateOne({ $set: { algorithms } });

    //1. 3 player algorithm in Cash Out
    if (admin.algorithms[0]?.active) {
      this.threePlayers = this.threePlayers.filter(u => u.playerId !== userPayload?.id);
      if (!this.threePlayers.length) {
        this.loading();
        return { message: "Вы выиграли" };
      }
    }

    // 2. Net income algorithm
    if (admin.algorithms[1]?.active) {
      const totalWinAmount = this.currentPlayers.reduce((prev, next) => prev + next.win, 0);
      if (totalWinAmount >= this.maxWinAmount) {
        this.loading();
        return { message: "Вы выиграли" };
      }
    }

    // 7. Bet counts algorithm
    if (admin.algorithms[6]?.active) {
      const winsCount = this.currentPlayers.filter(bet => {
        return bet.win;
      }).length;

      if (winsCount >= this.totalWinsCount) {
        this.loading();
        return { message: "Вы выиграли" };
      }
    }

    // 8. -------------

    if (admin.algorithms[7]?.active) {
      const totalWinAmount = this.currentPlayers.reduce((prev, next) => prev + next.win, 0);
      if (totalWinAmount >= this.maxWinAmount) {
        this.loading();
        return { message: "Вы выиграли" };
      }
    }

    if (admin.algorithms[9]?.active) {
      if (this.playedCount < this.maxGameCount / 2) {
        this.totalWins += win;
      } else {
        const totalWinAmount = this.currentPlayers.reduce((prev, next) => prev + next.win, 0);

        if (totalWinAmount >= this.partOfProfit) {
          this.loading();
          return { message: "Вы выиграли" };
        }
      }
    }

    return { message: "Вы выиграли" };
  }

  private async loading() {
    clearInterval(this.interval);
    this.socket.emit("crash");

    await this.coeffModel.create({ coeff: +this.x.toFixed(2) });

    this.x = 1;
    this.step = 0.0006;
    this.random = _.random(MAX_COEFF, true);

    const admin = await this.adminModel.findOne();

    this.algorithms = admin?.algorithms;

    this.currentPlayers = [];
    this.betAmount = 0;
    this.winAmount = 0;

    this.threePlayers = [];

    await sleep(STOP_DISABLE_MS);

    this.isBetWait = false;

    this.socket.emit("loading");

    await sleep(LOADING_MS);

    const algorithms = admin.algorithms.map(algorithm => {
      if (algorithm.active) {
        algorithm.used_count++;
      }

      return algorithm;
    });

    await admin.updateOne({ $set: { algorithms } });

    //1. 3 player algorithm loading
    if (this.algorithms[0]?.active) {
      this.threePlayers = _.sampleSize(this.threePlayers, 3);
      this.random = _.random(110, true);
    }

    // 2. Net income algorithm loading
    if (this.algorithms[1]?.active) {
      const totalAmount = this.currentPlayers.reduce((prev, curr) => prev + curr.bet, 0);
      this.maxWinAmount = (totalAmount * _.random(30, 100, true)) / 100;
    }

    // 3. 1-3 Coeff algorithm
    if (this.algorithms[2]?.active) {
      this.random = _.random(1, 3);
    }

    // 4. 1-3 Coeff algorithm
    if (this.algorithms[3]?.active) {
      this.random = _.random(2, 20);
    }

    // 5. 1-2 Coeff algorithm
    if (this.algorithms[4]?.active) {
      this.random = _.random(1, 2, true);
    }

    // 7. Bet counts algorithm
    if (this.algorithms[6]?.active) {
      this.random = _.random(5, 10, true);
      this.totalWinsCount = (this.currentPlayers.length * _.random(20, 70, true)) / 100;
    }

    // 8. --------
    if (this.algorithms[7]?.active) {
      const range = _.random(1, 3, true);
      const totalAmount = this.currentPlayers.reduce((prev, curr) => prev + curr.bet, 0);
      this.maxWinAmount = totalAmount * range;
    }

    // 9. ---------
    if (this.algorithms[8]?.active) {
      const randomCoeff = _.sample(this.randomCoeffs);
      this.random = _.random(randomCoeff - 0.2, randomCoeff - 0.01);
    }

    if (this.algorithms[9]?.active) {
      this.playedCount++;
      if (this.playedCount < this.maxGameCount / 2) {
        this.random = _.random(1.3, 1.8, true);
        const totalAmount = this.currentPlayers.reduce((prev, curr) => prev + curr.bet, 0);
        this.totalBets += totalAmount;
      } else if (this.playedCount == this.maxGameCount / 2) {
        const profit = this.totalBets - this.totalWins;
        this.partOfProfit = profit / (this.maxGameCount / 2);
        if (profit < 0) {
          this.loading();
          return (this.interval = setInterval(() => this.game(), 100));
        }
      } else if (this.playedCount == this.maxGameCount) {
        this.playedCount = 0;
        this.totalBets = 0;
        this.totalWins = 0;
      }
    }

    this.interval = setInterval(() => this.game(), 100);
  }
}
