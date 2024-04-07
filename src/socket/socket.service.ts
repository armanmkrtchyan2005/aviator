import { WsException } from "@nestjs/websockets";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, { Model } from "mongoose";
import { Socket } from "socket.io";
import { IAuthPayload } from "src/auth/auth.guard";
import { ConvertService } from "src/convert/convert.service";
import { User } from "src/user/schemas/user.schema";
import { BetDto } from "./dto/bet.dto";
import { Bet, IAmount, IBet } from "src/bets/schemas/bet.schema";
import { CashOutDto } from "./dto/cashOut.dto";
import { Admin, IAlgorithms } from "src/admin/schemas/admin.schema";
import { Referral } from "src/user/schemas/referral.schema";
import { UserPromo } from "src/user/schemas/userPromo.schema";
import { Game, GameDocument } from "src/bets/schemas/game.schema";
import { Session } from "src/user/schemas/session.schema";
import { generateUsername } from "unique-username-generator";
import { SchedulerRegistry } from "@nestjs/schedule";
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
  private npcLength: number;

  private betGame: GameDocument = null;

  private currentPlayers: IBet[] = [];
  private betAmount: IAmount = {};
  private winAmount: IAmount = {};

  private algorithms: IAlgorithms[] = [];
  private selectedAlgorithmId: number;
  public socket: Socket = null;

  private x = 1;
  private step = 0.0006;
  private isBetWait = true;

  private interval: string | number | NodeJS.Timeout;
  private random = _.random(1, true);
  // Algorithm 1
  private threePlayers: IBet[] = [];

  // Algorithm 2, Algorithm 8
  private maxWinAmount: number = 0;

  // Algorithm 7
  private randomOneHourTimeOut: string | number | NodeJS.Timeout;

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

  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Bet.name) private betModel: Model<Bet>,
    @InjectModel(UserPromo.name) private userPromoModel: Model<UserPromo>,
    @InjectModel(Admin.name) private adminModel: Model<Admin>,
    @InjectModel(Referral.name) private referralModel: Model<Referral>,
    @InjectModel(Game.name) private gameModel: Model<Game>,
    @InjectModel(Session.name) private sessionModel: Model<Session>,
    private schedulerRegistry: SchedulerRegistry,
    private convertService: ConvertService,
  ) {}

  async handleConnection(client: Socket) {
    const currentPlayers = this.currentPlayers.map(({ _id, playerId, promo, ...bet }) => bet).sort((a, b) => b.bet["USD"] - a.bet["USD"]);
    this.socket.emit("currentPlayers", { betAmount: this.betAmount, winAmount: this.winAmount, currentPlayers });

    const token = client.handshake?.auth?.token;

    const session = await this.sessionModel.findOne({ token }).populate("user");

    if (!session?.user) {
      return;
    }

    const user = await this.userModel.findById(session.user);

    user.active = true;

    await user.save();
  }

  async handleDisconnect(client: Socket) {
    const token = client.handshake?.auth?.token;

    const session = await this.sessionModel.findOne({ token }).populate("user");

    if (!session?.user) {
      return;
    }

    const user = await this.userModel.findById(session.user);

    user.active = false;
    user.lastActiveDate = new Date();

    await user.save();
  }

  private async randomOneHourAlgorithm() {
    const admin = await this.adminModel.findOne();
    if (admin.algorithms[5].active) {
      const daley = _.random(HOUR_IN_MS, 2 * HOUR_IN_MS);
      this.randomOneHourTimeOut = setTimeout(() => {
        this.random = _.random(1, 100, true);
        this.randomOneHourAlgorithm();
      }, daley);
    }
  }

  async init() {
    this.betGame = await this.gameModel.create({});
    this.handleStartGame();
  }

  async handleStartGame() {
    this.interval = setInterval(() => this.game(), 100);

    // 6. random one hour algorithm
    this.randomOneHourAlgorithm();
  }

  async game() {
    this.x += this.step;
    this.step += 0.0006;

    this.socket.emit("game", { x: +this.x.toFixed(2) });

    // 4. ----------
    if (this.selectedAlgorithmId === 4) {
      if (this.x > 1.9 && this.x < 2.2) {
        this.threePlayers = _.sampleSize(this.currentPlayers, 3);
        this.random = _.random(110, true);
      }
    }

    if (this.x >= this.random) {
      return this.loading();
    }
  }

  async handleBet(userPayload: IAuthPayload, dto: BetDto) {
    if (this.isBetWait) {
      return new WsException("Ставки сейчас не применяются");
    }

    const user = await this.userModel.findById(userPayload?.id, ["currency", "balance", "bonuses", "login", "profileImage", "playedAmount"]);
    const admin = await this.adminModel.findOne({}, ["gameLimits", "algorithms", "currencies", "our_balance"]);

    if (!user) {
      return new WsException("Пользователь не авторизован");
    }

    const userPromo = await this.userPromoModel.findOne({ user: user._id, promo: dto.promoId, active: false }).populate("promo");

    const minBet = admin.gameLimits.min[user.currency];
    const maxBet = admin.gameLimits.max[user.currency];

    if (dto.bet < minBet) {
      return new WsException(`Минимальная ставка ${minBet} ${user.currency}`);
    }

    if (dto.bet > maxBet) {
      return new WsException(`Максимальная ставка ${maxBet} ${user.currency}`);
    }

    const bet: IAmount = {};

    if (!userPromo) {
      for (const currency of admin.currencies) {
        bet[currency] = await this.convertService.convert(dto.currency, currency, dto.bet);
      }

      if (bet[user.currency] > user.balance) {
        return new WsException("Недостаточно денег на балансе");
      }

      user.balance -= bet[user.currency];

      user.playedAmount += bet[user.currency];

      await user.save();
    } else {
      for (const currency of admin.currencies) {
        bet[currency] = await this.convertService.convert(userPromo.promo.currency, currency, userPromo.promo.amount);
      }

      userPromo.active = true;
      await userPromo.save();
    }

    const betDataObject: IBet = {
      playerId: userPayload.id,
      playerLogin: user.login,
      profileImage: user.profileImage,
      // currency: user.currency,
      bet,
      promo: userPromo?.promo,
      game: this.betGame,
      time: new Date(),
      betNumber: dto.betNumber,
      user_balance: user.balance,
    };

    const betData = await this.betModel.create({ ...betDataObject, user_balance: user.balance });

    betDataObject._id = betData._id.toString();
    this.currentPlayers.push(betDataObject);

    for (let key in this.betAmount) {
      this.betAmount[key] += bet[key];
    }

    const currentPlayers = this.currentPlayers.map(({ _id, playerId, promo, ...bet }) => bet).sort((a, b) => b.bet["USD"] - a.bet["USD"]);
    this.socket.emit("currentPlayers", { betAmount: this.betAmount, winAmount: this.winAmount, currentPlayers });

    admin.our_balance += bet["USD"];

    await admin.save();

    const algorithms = admin.algorithms.map(algorithm => {
      if (this.selectedAlgorithmId == algorithm.id) {
        algorithm.all_bets_amount += betDataObject.bet["USD"];
      }

      return algorithm;
    });

    await admin.updateOne({ $set: { algorithms } });

    return { message: "Ставка сделана" };
  }

  async handleCancel(userPayload: IAuthPayload, dto: CashOutDto) {
    if (this.isBetWait) {
      return new WsException("Отмена ставки невозможна");
    }

    const user = await this.userModel.findById(userPayload.id);

    const admin = await this.adminModel.findOne({}, ["gameLimits", "currencies", "our_balance"]);

    const bet = this.currentPlayers.find(b => {
      return b.playerId == userPayload?.id.toString() && dto.betNumber === b.betNumber;
    });

    if (!bet) {
      return new WsException("У вас нет такой ставки");
    }

    await this.betModel.findByIdAndDelete(bet._id);

    user.balance += bet.bet[user.currency];
    user.playedAmount -= bet.bet[user.currency];
    await user.save();

    admin.our_balance -= bet.bet["USD"];
    await admin.save();

    for (let key in this.betAmount) {
      this.betAmount[key] -= bet[key];
    }

    this.currentPlayers = this.currentPlayers.filter(player => player._id !== bet._id);
    this.socket.emit("currentPlayers", { betAmount: this.betAmount, winAmount: this.winAmount, currentPlayers: this.currentPlayers });

    return { message: "Ставка отменена" };
  }

  async handleCashOut(userPayload: IAuthPayload, dto: CashOutDto) {
    const x = this.x;

    const user = await this.userModel.findById(userPayload.id);
    const admin = await this.adminModel.findOne({}, ["algorithms", "currencies", "our_balance", "gameLimits"]);

    const betIndex = this.currentPlayers.findIndex(b => {
      return b.playerId == userPayload?.id.toString() && dto.betNumber === b.betNumber;
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

    const win: IAmount = {};
    for (const currency of admin.currencies) {
      win[currency] = +(x * betData.bet[currency]).toFixed(2);
    }

    if (win[user.currency] > admin.gameLimits.maxWin[user.currency]) {
      for (const currency of admin.currencies) {
        win[currency] = admin.gameLimits.maxWin[currency];
      }
    }

    this.currentPlayers[betIndex] = {
      ...betData,
      win,
      coeff: x,
    };

    const bet = await this.betModel.findById(betData._id);

    bet.win = win;
    bet.coeff = x;
    bet.user_balance = user.balance;

    await bet.save();

    admin.our_balance -= win["USD"];

    await admin.save();

    for (let key in this.winAmount) {
      this.winAmount[key] += win[key];
    }

    const currentPlayers = this.currentPlayers.map(({ _id, playerId, promo, ...bet }) => bet).sort((a, b) => b.bet["USD"] - a.bet["USD"]);

    this.socket.emit("currentPlayers", { betAmount: this.betAmount, winAmount: this.winAmount, currentPlayers });

    user.balance += win[user.currency];

    if (x < 1.2) {
      user.playedAmount -= betData.bet[user.currency];
    }

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

    let totalWinAmount: number;

    switch (this.selectedAlgorithmId) {
      //1. 3 player algorithm in Cash Out
      case 1:
        this.threePlayers = this.threePlayers.filter(u => u.playerId !== userPayload?.id);
        if (!this.threePlayers.length) {
          admin.algorithms[0].all_withdrawal_amount += win["USD"];
          admin.algorithms[0].used_count++;
          await admin.updateOne({ $set: { algorithms: admin.algorithms } });
          this.loading();
          return { message: "Вы выиграли" };
        }
        break;

      // 2. Net income algorithm
      case 2:
        totalWinAmount = this.currentPlayers.reduce((prev, next) => prev + next.win["USD"], 0);
        if (totalWinAmount >= this.maxWinAmount) {
          admin.algorithms[1].all_withdrawal_amount += win["USD"];
          admin.algorithms[1].used_count++;
          await admin.updateOne({ $set: { algorithms: admin.algorithms } });
          this.loading();
          return { message: "Вы выиграли" };
        }
        break;

      // 7. Bet counts algorithm
      case 7:
        const winsCount = this.currentPlayers.filter(bet => {
          return bet.win;
        }).length;

        if (winsCount >= this.totalWinsCount) {
          admin.algorithms[6].all_withdrawal_amount += win["USD"];
          admin.algorithms[6].used_count++;
          await admin.updateOne({ $set: { algorithms: admin.algorithms } });
          this.loading();
          return { message: "Вы выиграли" };
        }
        break;

      // 8. -------------
      case 8:
        totalWinAmount = this.currentPlayers.reduce((prev, next) => prev + next.win["USD"], 0);
        if (totalWinAmount >= this.maxWinAmount) {
          admin.algorithms[7].all_withdrawal_amount += win["USD"];
          admin.algorithms[7].used_count++;
          await admin.updateOne({ $set: { algorithms: admin.algorithms } });
          this.loading();
          return { message: "Вы выиграли" };
        }
        break;

      // 9. -------------
      case 9:
        if (this.playedCount < this.maxGameCount / 2) {
          this.totalWins += win["USD"];
        } else {
          const totalWinAmount = this.currentPlayers.reduce((prev, next) => prev + next.win["USD"], 0);

          if (totalWinAmount >= this.partOfProfit) {
            admin.algorithms[9].all_withdrawal_amount += win["USD"];
            admin.algorithms[9].used_count++;
            await admin.updateOne({ $set: { algorithms: admin.algorithms } });
            this.loading();
            return { message: "Вы выиграли" };
          }
        }
        break;

      default:
        break;
    }

    return { message: "Вы выиграли" };
  }

  async handleDrain() {
    this.loading();

    return { message: "Игра остановлена" };
  }

  private async loading() {
    clearInterval(this.interval);

    for (let i = 0; i < this.npcLength; i++) {
      try {
        this.schedulerRegistry.deleteInterval(`bot-${i}`);
      } catch (error) {}
    }

    this.socket.emit("crash");
    const game_coeff = +this.x.toFixed(2);

    this.betGame.game_coeff = game_coeff;
    this.betGame.endedAt = new Date();

    try {
      await this.betGame.save();
    } catch (e) {
      throw new WsException(e.message);
    }

    this.betGame = await this.gameModel.create({});

    if (this.currentPlayers.length) {
      const bets = await this.betModel.find().limit(this.currentPlayers.length).sort({ time: -1 });

      const betsId = bets.map(bet => bet._id);

      await this.betModel.updateMany({ _id: { $in: betsId } }, { $set: { game_coeff } });
    }

    this.x = 1;
    this.step = 0.0006;
    this.random = _.random(MAX_COEFF, true);

    const admin = await this.adminModel.findOne();

    this.algorithms = admin?.algorithms;

    this.currentPlayers = [];
    this.betAmount = {};
    this.winAmount = {};

    for (const currency of admin.currencies) {
      this.betAmount[currency] = 0;
      this.winAmount[currency] = 0;
    }

    this.threePlayers = [];

    await sleep(STOP_DISABLE_MS);

    this.isBetWait = false;

    this.socket.emit("loading");
    this.npcLength = _.random(admin.bots.count.min, admin.bots.count.max); // stanal tvery bazaic
    for (let i = 0; i < this.npcLength && admin.bots.active; i++) {
      setTimeout(async () => {
        const bet: IAmount = {};

        for (const currency of admin.currencies) {
          bet[currency] = await this.convertService.convert("USD", currency, _.random(admin.bots.betAmount.min, admin.bots.betAmount.max)); // stanal tvery bazaic
        }

        const bot: IBet = {
          bet,
          betNumber: 1,
          game: this.betGame,
          playerId: new mongoose.Types.ObjectId().toString(),
          playerLogin: generateUsername("", 4, 30),
          profileImage: "",
          time: new Date(),
          user_balance: 0,
        };

        const botBet = await this.betModel.create(bot);

        this.currentPlayers.push(bot);

        for (let key in this.betAmount) {
          this.betAmount[key] += bet[key];
        }

        const currentPlayers = this.currentPlayers.map(({ _id, playerId, promo, ...bet }) => bet).sort((a, b) => b.bet["USD"] - a.bet["USD"]);
        for (let key in this.betAmount) {
          this.betAmount[key] += bet[key];
        }

        const winCoeff = _.random(admin.bots.coeff.min, admin.bots.coeff.max, true);

        const intervalId = setInterval(async () => {
          if (this.x >= winCoeff) {
            this.schedulerRegistry.deleteInterval(`bot-${i}`);

            bot.coeff = this.x;
            bot.win = {};

            for (let key in this.betAmount) {
              bot.win[key] = bet[key] * this.x;
              this.winAmount[key] += bot.win[key];
            }

            const currentPlayers = this.currentPlayers.map(({ _id, playerId, promo, ...bet }) => bet).sort((a, b) => b.bet["USD"] - a.bet["USD"]);
            this.socket.emit("currentPlayers", { betAmount: this.betAmount, winAmount: this.winAmount, currentPlayers });

            botBet.coeff = bot.coeff;
            botBet.win = bot.win;

            await botBet.save();
          }
        }, 100);

        this.schedulerRegistry.addInterval(`bot-${i}`, intervalId);

        this.socket.emit("currentPlayers", { betAmount: this.betAmount, winAmount: this.winAmount, currentPlayers });
      }, 50 * i);
    }

    await sleep(LOADING_MS);
    this.isBetWait = true;

    const excludedAlgorithmsId = [];

    if (this.currentPlayers.length <= 3) {
      excludedAlgorithmsId.push(1, 4);
    }

    const activeAlgorithms = this.algorithms.filter(alg => alg.active && !excludedAlgorithmsId.includes(alg.id));

    this.selectedAlgorithmId = _.sample(activeAlgorithms).id;

    console.log(this.selectedAlgorithmId);

    this.betGame.algorithm_id = this.selectedAlgorithmId;

    await this.betGame.save();

    let totalAmount: number;
    switch (this.selectedAlgorithmId) {
      //1. 3 player algorithm loading
      case 1:
        this.threePlayers = _.sampleSize(this.currentPlayers, 3);

        this.random = _.random(80, 110, true);
        break;

      // 2. Net income algorithm loading
      case 2:
        totalAmount = this.currentPlayers.reduce((prev, curr) => prev + curr.bet["USD"], 0);
        this.maxWinAmount = (totalAmount * _.random(30, 100, true)) / 100;
        break;

      // 3. 1-3 Coeff algorithm
      case 3:
        this.random = _.random(1, 3, true);
        break;

      // 4. 1-3 Coeff algorithm
      case 4:
        this.random = _.random(2, 20, true);
        break;

      // 5. 1-2 Coeff algorithm
      case 5:
        this.random = _.random(1, 2, true);
        break;

      // 7. Bet counts algorithm
      case 7:
        this.random = _.random(5, 10, true);
        this.totalWinsCount = (this.currentPlayers.length * _.random(20, 70, true)) / 100;
        break;

      // 8. --------
      case 8:
        const range = _.random(1, 3, true);
        totalAmount = this.currentPlayers.reduce((prev, curr) => prev + curr.bet["USD"], 0);
        this.maxWinAmount = totalAmount * range;
        break;

      // 9. ---------
      case 9:
        const randomCoeff = _.sample(this.randomCoeffs);
        this.random = _.random(randomCoeff - 0.2, randomCoeff - 0.01);
        break;

      // 10. --------
      case 10:
        this.playedCount++;
        if (this.playedCount < this.maxGameCount / 2) {
          this.random = _.random(1.3, 1.8, true);
          const totalAmount = this.currentPlayers.reduce((prev, curr) => prev + curr.bet["USD"], 0);
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
        break;
      default:
        break;
    }

    this.interval = setInterval(() => this.game(), 100);
  }
}
