import mongoose, { Model } from "mongoose";
import { WsException } from "@nestjs/websockets";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
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
import { CronExpression, SchedulerRegistry } from "@nestjs/schedule";
import { IdentityCounter } from "src/admin/schemas/identity-counter.schema";
import { CronJob } from "cron";
import Big from "big.js";
import * as _ from "lodash";

const STOP_DISABLE_MS = 2000;
const LOADING_MS = 5000;
const MAX_COEFF = 1;

function sleep(ms: number = 0) {
  return new Promise(res => setTimeout(res, ms));
}

function socketException(message: string) {
  return {
    message,
    success: false,
  };
}

@Injectable()
export class SocketService {
  private drainLock = false; // добавляем переменную для блокировки

  private npcLength: number;

  private betGame: GameDocument = null;

  private currentPlayers: IBet[] = [];
  private currentPlayersWithoutBots: IBet[] = [];
  private betAmount: IAmount = {};
  private betAmountWithoutBots: IAmount = {};
  private winAmount: IAmount = {};
  private winAmountWithoutBots: IAmount = {};

  private algorithms: IAlgorithms[] = [];
  private selectedAlgorithmId: number;
  public socket: Socket = null;

  private x = 1;
  private step = 0.0006;
  private ms = 100;
  private isBetWait = true;

  private interval: string | number | NodeJS.Timeout;
  private random = _.random(1, true);
  // Algorithm 1
  private threePlayers: IBet[] = [];

  // Algorithm 2, Algorithm 8
  private maxWinAmount: number = 0;

  // Algorithm 7
  private randomOneHour: boolean = false;
  private randomEleven: boolean = false;
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
    @InjectModel(IdentityCounter.name) private identityCounterModel: Model<IdentityCounter>,
    private schedulerRegistry: SchedulerRegistry,
    private convertService: ConvertService,
  ) {}

  private drawCurrentPlayers() {
    let currentPlayers = _.map(this.currentPlayers, ({ _id, playerId, promo, ...bet }) => bet);
    // let currentPlayers = this.currentPlayers.map(({ _id, playerId, promo, ...bet }) => bet);
    currentPlayers = _.orderBy(currentPlayers, k => k?.bet?.USD, "desc");
    this.socket.emit("currentPlayers", { betAmount: this.betAmount, winAmount: this.winAmount, currentPlayers });
  }

  async handleConnection(client: Socket) {
    const admin = await this.adminModel.findOne();

    if (!this.isBetWait) {
      this.socket.emit("loading");
    }

    if (!admin.bot_is_active) {
      clearInterval(this.interval);
      return this.socket.emit("bot-stop", admin.bot_text);
    }

    if (!admin.game_is_active) {
      return this.socket.emit("game-stop", admin.game_text);
    }

    this.drawCurrentPlayers();

    const token = client.handshake?.auth?.token;

    const session = await this.sessionModel.findOne({ token }).populate("user");

    if (!session?.user) {
      return;
    }

    const user = await this.userModel.findById(session.user);

    user.active = true;

    await user.save();
    client.join(user._id.toString());

    // const userCurrentBets = this.currentPlayers.filter(currentPlayer => currentPlayer.playerId == user._id.toString());
    // this.socket.to(user._id.toString()).emit("user-current-bets", userCurrentBets);

    this.socket.to(user._id.toString()).emit("user-balance", user.balance);
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

    this.socket.to(user._id.toString());

    const admin = await this.adminModel.findOne({}, ["gameLimits", "currencies", "our_balance"]);

    const bets = this.currentPlayers.filter(b => {
      return b.playerId == user._id?.toString();
    });

    for (const bet of bets) {
      await this.betModel.findByIdAndDelete(bet._id);

      user.balance += bet.bet[user.currency];
      user.playedAmount -= bet.bet[user.currency];

      admin.our_balance -= bet.bet["USD"];
    }

    await user.save();
    await admin.save();

    this.socket.to(user._id.toString()).emit("user-balance", user.balance);
  }

  private async randomSixAlgorithm() {
    const job = new CronJob(CronExpression.EVERY_HOUR, async () => {
      // set random delay between 5(min) and 50(max) minutes
      const admin = await this.adminModel.findOne();

      if (admin.algorithms[5].active) {
        const delay = Math.floor(Math.random() * (3e6 - 300000) + 300000);

        setTimeout(() => {
          this.randomOneHour = true;
        }, delay);

        console.log(`running scraper in ${delay / 60000} minutes`);
      }
    });

    job.start();
  }

  private async randomElevenAlgorithm() {
    const job = new CronJob(CronExpression.EVERY_10_MINUTES, async () => {
      const admin = await this.adminModel.findOne();

      if (admin.algorithms[10]?.active) {
        // set random delay between 1(min) and 9(max) minutes
        const delay = Math.floor(Math.random() * (540000 - 60000) + 60000);

        setTimeout(() => {
          this.randomEleven = true;
        }, delay);

        console.log(`running scraper in ${delay / 60000} minutes`);
      }
    });

    job.start();
  }

  async init() {
    try {
      this.betGame = await this.gameModel.create({});
    } catch (error) {
      console.log(error);
    }
    this.handleStartGame();
  }

  async handleStartGame() {
    this.interval = setInterval(() => this.game(), this.ms);

    // 6. random one hour algorithm
    this.randomSixAlgorithm();
    this.randomElevenAlgorithm();
  }

  async game() {
    this.socket.emit("game", { x: this.x });

    this.x = new Big(this.x).plus(this.step).toNumber();
    this.step = new Big(this.step).plus(0.0006).toNumber();

    // 4. ----------
    if (this.selectedAlgorithmId === 4) {
      if (this.x >= 1.8 && this.x <= 2.1) {
        this.threePlayers = _.sampleSize(this.currentPlayers, 3);
        this.random = _.random(110, true);
      }
    }

    if (this.x >= this.random) {
      return this.loading();
    }

    // if (this.x == 2) {
    //   this.ms = 50;

    //   clearInterval(this.interval);

    //   this.interval = setInterval(() => this.game(), this.ms);
    // } else if (this.x == 5) {
    //   this.ms = 25;

    //   clearInterval(this.interval);

    //   this.interval = setInterval(() => this.game(), this.ms);
    // } else if (this.x == 10) {
    //   this.ms = 15;

    //   clearInterval(this.interval);

    //   this.interval = setInterval(() => this.game(), this.ms);
    // }
  }

  async handleBet(userPayload: IAuthPayload, dto: BetDto) {
    if (this.isBetWait) {
      return socketException("Ставки сейчас не применяются");
    }

    const user = await this.userModel.findById(userPayload?.id, ["currency", "balance", "bonuses", "login", "profileImage", "playedAmount"]);
    const admin = await this.adminModel.findOne({}, ["gameLimits", "algorithms", "currencies", "our_balance"]);
    if (!user) {
      return socketException("Пользователь не авторизован");
    }

    const userCurrentBets = this.currentPlayers.filter(currentPlayer => currentPlayer.playerId == user._id.toString());

    const isBetNumberFined = userCurrentBets.some(b => b.betNumber === dto.betNumber);

    if (isBetNumberFined && userCurrentBets.length >= 2) {
      return socketException("Ошибка. Вы уже сделали максимально возможное количество ставок.");
    }

    const betDataObject: IBet | any = { betNumber: dto.betNumber, playerId: userPayload?.id.toString() };

    this.currentPlayers.push(betDataObject as IBet);

    const userPromo = await this.userPromoModel.findOne({ user: user._id, active: false, promo: dto.promoId, amount: { $exists: true } }).populate("promo");

    const minBet = admin.gameLimits.min[user.currency];
    const maxBet = admin.gameLimits.max[user.currency];

    if (!userPromo && dto.bet < minBet) {
      this.currentPlayers = this.currentPlayers.filter(player => player.playerId != betDataObject.playerId && player.betNumber != betDataObject.betNumber);

      return socketException(`Минимальная ставка ${minBet} ${user.currency}`);
    }

    if (!userPromo && dto.bet > maxBet) {
      this.currentPlayers = this.currentPlayers.filter(player => player.playerId != betDataObject.playerId && player.betNumber != betDataObject.betNumber);
      return socketException(`Максимальная ставка ${maxBet} ${user.currency}`);
    }

    const bet: IAmount = {};

    if (!userPromo) {
      for (const currency of admin.currencies) {
        bet[currency] = await this.convertService.convert(dto.currency, currency, dto.bet);
      }

      if (bet[user.currency] > user.balance) {
        this.currentPlayers = this.currentPlayers.filter(player => player.playerId != betDataObject.playerId && player.betNumber != betDataObject.betNumber);
        return socketException("Недостаточно средств на балансе");
      }

      user.balance -= bet[user.currency];

      user.playedAmount += bet[user.currency];

      await user.save();
    } else {
      for (const currency of admin.currencies) {
        bet[currency] = await this.convertService.convert(user.currency, currency, userPromo.amount);
      }

      userPromo.active = true;
      await userPromo.save();
    }

    betDataObject.playerLogin = user.login;
    betDataObject.profileImage = user.profileImage;
    betDataObject.bet = bet;
    betDataObject.promo = userPromo?.promo || userPromo?.bonus;
    betDataObject.userPromo = userPromo;
    betDataObject.game = this.betGame;
    betDataObject.time = new Date();
    betDataObject.user_balance = user.balance;

    const betData = await this.betModel.create({ ...betDataObject, user_balance: user.balance });

    betDataObject._id = betData._id.toString();

    // this.currentPlayers.push(betDataObject);

    for (let key in this.betAmount) {
      this.betAmount[key] += bet[key];
      this.betAmountWithoutBots[key] += bet[key];
    }

    this.drawCurrentPlayers();

    // userCurrentBets.push(betDataObject);
    // this.socket.to(user._id.toString()).emit("user-current-bets", userCurrentBets);
    this.socket.to(user._id.toString()).emit("user-balance", user.balance);

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
      return socketException("Отмена ставки невозможна");
    }

    const user = await this.userModel.findById(userPayload.id);

    const admin = await this.adminModel.findOne({}, ["gameLimits", "currencies", "our_balance"]);

    const bet = this.currentPlayers.find(b => {
      return b.playerId == userPayload?.id.toString() && dto.betNumber === b.betNumber;
    });

    if (!bet) {
      return socketException("У вас нет такой ставки");
    }

    await this.betModel.findByIdAndDelete(bet._id);

    user.balance += bet.bet[user.currency];
    user.playedAmount -= bet.bet[user.currency];

    await user.save();

    admin.our_balance -= bet.bet["USD"];
    await admin.save();

    try {
      bet.userPromo.active = false;
      await bet.userPromo?.save();
    } catch (error) {}

    for (let key in this.betAmount) {
      this.betAmount[key] -= bet[key];
      this.betAmountWithoutBots[key] -= bet[key];
    }

    this.currentPlayers = this.currentPlayers.filter(player => player._id !== bet._id);
    this.socket.emit("currentPlayers", { betAmount: this.betAmount, winAmount: this.winAmount, currentPlayers: this.currentPlayers });

    // const userCurrentBets = this.currentPlayers.filter(currentPlayer => currentPlayer.playerId == user._id.toString());
    // this.socket.to(user._id.toString()).emit("user-current-bets", userCurrentBets);
    this.socket.to(user._id.toString()).emit("user-balance", user.balance);

    console.log("CANCELED");

    return { message: "Ставка отменена", success: true };
  }

  async handleCashOut(userPayload: IAuthPayload, dto: CashOutDto) {
    const x = dto.winX ? dto.winX : this.x;

    const user = await this.userModel.findById(userPayload.id);
    const admin = await this.adminModel.findOne({}, ["algorithms", "currencies", "our_balance", "gameLimits"]);

    const betIndex = this.currentPlayers.findIndex(b => {
      return b.playerId == userPayload?.id.toString() && dto.betNumber === b.betNumber;
    });

    if (betIndex == -1) {
      throw new WsException("У вас нет такой ставки");
    }

    const betData = this.currentPlayers[betIndex];
    if (betData.win) {
      throw new WsException("Вы уже сняли эту ставку");
    }

    if (betData.promo && this.x < betData?.promo?.coef) {
      throw new WsException(`Вы не можете выиграть до ${betData.promo.coef}x`);
    }

    if (betData.promo && this.x < betData?.promo?.coef) {
      throw new WsException(`Вы не можете выиграть до ${betData.promo.coef}x`);
    }

    let win: IAmount = {};

    for (const currency of admin.currencies) {
      win[currency] = +(x * betData.bet[currency]).toFixed(2);
    }

    if (win[user.currency] > admin.gameLimits.maxWin[user.currency]) {
      win = admin.gameLimits.maxWin;
      win["USD"] = await this.convertService.convert(user.currency, "USD", admin.gameLimits.maxWin[user.currency]);
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
      this.winAmountWithoutBots[key] += win[key];
    }

    this.drawCurrentPlayers();

    this.betGame.win = this.winAmountWithoutBots;

    // await this.betGame.save();

    user.balance += win[user.currency];

    if (x < 1.2) {
      user.playedAmount -= betData.bet[user.currency];
    }

    await user.save();

    // const userCurrentBets = this.currentPlayers.filter(currentPlayer => currentPlayer.playerId == user._id.toString());
    // this.socket.to(user._id.toString()).emit("user-current-bets", userCurrentBets);
    this.socket.to(user._id.toString()).emit("user-balance", user.balance);

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
          return { message: "Вы выиграли", success: true };
        }
        break;

      // 2. Net income algorithm
      case 2:
        totalWinAmount = this.currentPlayersWithoutBots.reduce((prev, next) => prev + next.win["USD"], 0);
        if (totalWinAmount >= this.maxWinAmount) {
          admin.algorithms[1].all_withdrawal_amount += win["USD"];
          admin.algorithms[1].used_count++;
          await admin.updateOne({ $set: { algorithms: admin.algorithms } });
          this.loading();
          return { message: "Вы выиграли", success: true };
        }
        break;

      // 7. Bet counts algorithm
      case 7:
        const winsCount = this.currentPlayersWithoutBots.filter(bet => {
          return bet.win;
        }).length;

        if (winsCount >= this.totalWinsCount) {
          admin.algorithms[6].all_withdrawal_amount += win["USD"];
          admin.algorithms[6].used_count++;
          await admin.updateOne({ $set: { algorithms: admin.algorithms } });
          this.loading();
          return { message: "Вы выиграли", success: true };
        }
        break;

      // 8. -------------
      case 8:
        totalWinAmount = this.currentPlayersWithoutBots.reduce((prev, next) => prev + next.win["USD"], 0);
        if (totalWinAmount >= this.maxWinAmount) {
          admin.algorithms[7].all_withdrawal_amount += win["USD"];
          admin.algorithms[7].used_count++;
          await admin.updateOne({ $set: { algorithms: admin.algorithms } });
          this.loading();
          return { message: "Вы выиграли", success: true };
        }
        break;

      // 9. -------------
      case 9:
        if (this.playedCount < this.maxGameCount / 2) {
          this.totalWins += win["USD"];
        } else {
          const totalWinAmount = this.currentPlayersWithoutBots.reduce((prev, next) => prev + next.win["USD"], 0);

          if (totalWinAmount >= this.partOfProfit) {
            admin.algorithms[9].all_withdrawal_amount += win["USD"];
            admin.algorithms[9].used_count++;
            await admin.updateOne({ $set: { algorithms: admin.algorithms } });
            this.loading();
            return { message: "Вы выиграли", success: true };
          }
        }
        break;

      default:
        break;
    }

    return { message: "Вы выиграли", success: true };
  }

  async handleDrain() {
    if (this.drainLock) {
      throw new WsException("Вы не можете слить игру во время загрузки игры");
    }

    this.drainLock = true; // устанавливаем блокировку

    try {
      if (this.x <= 1) {
        return { message: "Вы не можете слить игру во время загрузки игры" };
      }

      await this.loading();

      return { message: "Игра остановлена", success: true };
    } catch (error) {
      console.log(error);

      throw error;
    } finally {
      this.drainLock = false; // снимаем блокировку
    }
  }

  async handlePlayGame() {
    // const admin = await this.adminModel.findOne();

    // if (admin.game_is_active) {
    //   return;
    // }

    // console.log("Start");

    // admin.game_is_active = true;

    // await admin.save();

    // console.log(admin.game_is_active);

    try {
      console.log("Play");
      await this.loading();
    } catch (error) {
      console.log(error);
    }
  }

  private async loading() {
    this.drainLock = true;
    console.log("Loading...");

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
      console.log(e);
    }

    const gameFined = await this.gameModel.findOne({ uid: this.betGame.uid + 1 });

    if (gameFined) {
      this.betGame = gameFined;
      await this.identityCounterModel.findOneAndUpdate({ model: Game.name }, { $set: { count: this.betGame.uid } });
    } else {
      this.betGame = await this.gameModel.create({});
    }

    if (this.currentPlayers.length) {
      const bets = await this.betModel.find().limit(this.currentPlayers.length).sort({ time: -1 });

      const betsId = bets.map(bet => bet._id);

      await this.betModel.updateMany({ _id: { $in: betsId } }, { $set: { game_coeff } });
    }

    this.x = 1;
    this.step = 0.0006;
    this.ms = 100;
    this.random = _.random(MAX_COEFF, true);

    const admin = await this.adminModel.findOne();

    this.algorithms = admin?.algorithms;

    this.currentPlayers = [];
    this.betAmount = {};
    this.betAmountWithoutBots = {};
    this.winAmount = {};
    this.winAmountWithoutBots = {};

    for (const currency of admin.currencies) {
      this.betAmount[currency] = 0;
      this.betAmountWithoutBots[currency] = 0;
      this.winAmount[currency] = 0;
      this.winAmountWithoutBots[currency] = 0;
    }

    this.betGame.bet = this.betAmountWithoutBots;

    this.threePlayers = [];

    if (!admin.bot_is_active) {
      clearInterval(this.interval);
      return this.socket.emit("bot-stop", admin.bot_text);
    }

    if (!admin.game_is_active) {
      clearInterval(this.interval);
      return this.socket.emit("game-stop", admin.game_text);
    }

    await sleep(STOP_DISABLE_MS);

    this.isBetWait = false;

    this.socket.emit("loading");
    this.npcLength = _.random(admin.bots.count.min, admin.bots.count.max);
    for (let i = 0; i < this.npcLength && admin.bots.active; i++) {
      setTimeout(async () => {
        const bet: IAmount = {};
        const r = _.random(admin.bots.betAmount.min, admin.bots.betAmount.max);
        for (const currency of admin.currencies) {
          bet[currency] = await this.convertService.convert("USD", currency, r);
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
          isBot: true,
        };

        const botBet = await this.betModel.create(bot);

        this.currentPlayers.push(bot);

        for (let key in this.betAmount) {
          this.betAmount[key] += bet[key];
        }

        this.drawCurrentPlayers();

        const winCoeff = _.random(admin.bots.coeff.min, admin.bots.coeff.max, true);

        const intervalId = setInterval(async () => {
          if (this.x >= winCoeff) {
            try {
              this.schedulerRegistry.deleteInterval(`bot-${i}`);
            } catch (error) {
              console.log(error);
            }

            bot.coeff = this.x;
            bot.win = {};

            for (let key in this.betAmount) {
              bot.win[key] = bet[key] * this.x;
              this.winAmount[key] += bot.win[key];
            }

            this.drawCurrentPlayers();

            botBet.coeff = bot.coeff;
            botBet.win = bot.win;

            await botBet.save();
          }
        }, 100);
        try {
          this.schedulerRegistry.addInterval(`bot-${i}`, intervalId);
        } catch (error) {}
      }, 50 * i);
    }

    await sleep(LOADING_MS);
    this.drainLock = false;
    this.isBetWait = true;

    if (this.betGame.game_coeff) {
      console.log("x =>", this.betGame.game_coeff);

      this.random = this.betGame.game_coeff;
      this.interval = setInterval(() => this.game(), 100);
      return;
    }

    const excludedAlgorithmsId = [11];
    this.currentPlayersWithoutBots = this.currentPlayers.filter(bet => !bet.isBot);
    if (this.currentPlayersWithoutBots.length <= 3) {
      excludedAlgorithmsId.push(1, 4);
    }

    const activeAlgorithms = this.algorithms.filter(alg => alg.active && !excludedAlgorithmsId.includes(alg.id));

    this.selectedAlgorithmId = _.sample(activeAlgorithms)?.id;

    if (this.randomOneHour) {
      this.random = _.random(1, 100, true);
      this.randomOneHour = false;
      this.selectedAlgorithmId = 6;
    }

    if (this.randomEleven) {
      this.random = _.random(1, 1.5, true);
      this.randomEleven = false;
      this.selectedAlgorithmId = 11;
    }

    this.betGame.algorithm_id = this.selectedAlgorithmId;
    this.betGame.bet = this.betAmountWithoutBots;
    this.betGame.bets_count = this.currentPlayersWithoutBots.length;

    console.log(this.selectedAlgorithmId);

    if (!this.selectedAlgorithmId) {
      this.x = 1;
      this.socket.emit("game", { x: this.x });
      return this.loading();
    }

    try {
      await this.betGame.save();
    } catch (error) {}

    let totalAmount: number;
    switch (this.selectedAlgorithmId) {
      //1. 3 player algorithm loading
      case 1:
        this.threePlayers = _.sampleSize(this.currentPlayersWithoutBots, 3);

        this.random = _.random(80, 110, true);
        break;

      // 2. Net income algorithm loading
      case 2:
        totalAmount = this.currentPlayersWithoutBots.reduce((prev, curr) => prev + curr.bet["USD"], 0);
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

      case 6:
        this.random = _.random(1, 100, true);
        break;

      // 7. Bet counts algorithm
      case 7:
        this.random = _.random(5, 10, true);
        this.totalWinsCount = (this.currentPlayersWithoutBots.length * _.random(20, 70, true)) / 100;
        break;

      // 8. --------
      case 8:
        const range = _.random(1, 3, true);
        totalAmount = this.currentPlayersWithoutBots.reduce((prev, curr) => prev + curr.bet["USD"], 0);
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
          const totalAmount = this.currentPlayersWithoutBots.reduce((prev, curr) => prev + curr.bet["USD"], 0);
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
      case 12:
        this.random = _.random(1, 1.5, true);
        break;
      default:
        break;
    }

    this.interval = setInterval(() => this.game(), this.ms);
  }
}
