import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { ApiProperty } from "@nestjs/swagger";
import mongoose, { Model } from "mongoose";
import { Admin } from "src/admin/schemas/admin.schema";
import { IAuthPayload } from "src/auth/auth.guard";
import { User } from "src/user/schemas/user.schema";
import { MyBetsQueryDto } from "./dto/my-bets-query.dto";
import { DateSort, TopBetsQueryDto } from "./dto/top-bets.query.dto";
import { Bet, IAmount } from "./schemas/bet.schema";
import { Game } from "./schemas/game.schema";

export class LastBetsResponse {
  @ApiProperty({ type: "object", properties: { USD: { type: "number" }, RUB: { type: "number" } } })
  winAmount: IAmount;

  @ApiProperty({ type: "object", properties: { USD: { type: "number" }, RUB: { type: "number" } } })
  betAmount: IAmount;

  @ApiProperty({ isArray: true })
  bets: Bet;
}

@Injectable()
export class BetsService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Bet.name) private betModel: Model<Bet>,
    @InjectModel(Admin.name) private adminModel: Model<Admin>,
    @InjectModel(Game.name) private gameModel: Model<Game>,
  ) {}

  async topBets(query: TopBetsQueryDto) {
    const current = new Date();
    let lastMonth = new Date();
    let limit: number;

    if (query.dateSort === DateSort.DAY) {
      lastMonth.setDate(lastMonth.getDate() - 1);
      limit = 30;
    }

    if (query.dateSort === DateSort.MONTH) {
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      limit = 60;
    }

    if (query.dateSort === DateSort.YEAR) {
      lastMonth.setFullYear(lastMonth.getFullYear() - 1);
      limit = 100;
    }

    const bets = await this.betModel
      .aggregate([
        {
          $match: {
            time: {
              $gte: new Date(lastMonth),
              $lte: current,
            },
            win: {
              $exists: true,
            },
          },
        },
        { $lookup: { from: "users", localField: "playerId", foreignField: "_id", as: "player" } },
        { $unwind: { path: "$player", preserveNullAndEmptyArrays: true } },
        { $lookup: { from: "games", localField: "game", foreignField: "_id", as: "game" } },
        { $unwind: "$game" },
        { $set: { profileImage: "$player.profileImage", game_coeff: "$game.game_coeff" } },
        { $project: { player: 0 } },
      ])
      .limit(limit);

    return bets;
  }

  async myBets(auth: IAuthPayload, query: MyBetsQueryDto) {
    // const bets = await this.betModel.find({ playerId: auth.id }).skip(query.skip).limit(query.limit).sort({ time: -1 });
    const bets = await this.betModel.aggregate([
      {
        $match: { playerId: new mongoose.Types.ObjectId(auth.id) },
      },
      { $lookup: { from: "users", localField: "playerId", foreignField: "_id", as: "player" } },
      { $unwind: "$player" },
      { $set: { profileImage: "$player.profileImage" } },
      { $project: { player: 0 } },
      { $sort: { time: -1 } },
      { $skip: query.skip },
      { $limit: query.limit },
    ]);

    return bets;
  }

  async findLastCoeffs() {
    const coeffs = await this.gameModel
      .find({ game_coeff: { $exists: true }, endedAt: { $exists: true } }, { game_coeff: true, uid: true })
      .sort({ createdAt: -1 })
      .limit(30);

    return coeffs;
  }

  async findLastGame() {
    const { currencies } = await this.adminModel.findOne();

    const winAmount = {
      sum: {},
      project: {},
    };

    const betAmount = {
      sum: {},
      project: {},
    };

    for (let currency of currencies) {
      const winSumFieldName = `winAmount${currency}`;
      winAmount.sum[winSumFieldName] = { $sum: `$win.${currency}` };
      winAmount.project[currency] = "$" + winSumFieldName;

      const betSumFieldName = `betAmount${currency}`;
      betAmount.sum[betSumFieldName] = { $sum: `$bet.${currency}` };
      betAmount.project[currency] = "$" + betSumFieldName;
    }

    // ----------------------------GREL-----------------

    const game = await this.gameModel.findOne({}).sort({ createdAt: -1 });

    const lastGame = await this.gameModel.findOne({ endedAt: { $exists: true } }).sort({ createdAt: -1 });

    const lastBets = await this.betModel.aggregate([
      { $match: { game: lastGame._id } },
      { $sort: { createdAt: -1 } },
      { $lookup: { from: "games", localField: "game", foreignField: "_id", as: "game" } },
      { $unwind: "$game" },
      {
        $group: {
          _id: null,
          ...winAmount.sum,
          ...betAmount.sum,
          bets: { $push: "$$ROOT" },
        },
      },
      {
        $project: {
          _id: 0,
          winAmount: {
            ...winAmount.project,
          },
          betAmount: {
            ...betAmount.project,
          },
          bets: 1,
        },
      },
      { $limit: 1 },
    ]);

    return lastBets[0] || { winAmount: {}, betAmount: {}, bets: [] };
  }
}
