import { Injectable } from "@nestjs/common";
import { IAuthPayload } from "src/auth/auth.guard";
import { DateSort, MyBetsQueryDto } from "./dto/my-bets-query.dto";
import { InjectModel } from "@nestjs/mongoose";
import { User } from "src/user/schemas/user.schema";
import { Model } from "mongoose";
import { Bet, IAmount } from "./schemas/bet.schema";
import { Coeff } from "./schemas/coeff.schema";
import { LastGame } from "./schemas/lastGame.schema";
import { Admin } from "src/admin/schemas/admin.schema";
import { ApiProperty } from "@nestjs/swagger";

export class LastBetsResponse {
  @ApiProperty({ type: "object", properties: { USD: { type: "number" }, RUB: { type: "number" } } })
  winAmount: IAmount;

  @ApiProperty({ type: "object", properties: { USD: { type: "number" }, RUB: { type: "number" } } })
  betAmount: IAmount;

  @ApiProperty({ isArray: true })
  bets: LastGame;
}

@Injectable()
export class BetsService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Bet.name) private betModel: Model<Bet>,
    @InjectModel(Coeff.name) private coeffModel: Model<Coeff>,
    @InjectModel(LastGame.name) private lastGameModel: Model<LastGame>,
    @InjectModel(Admin.name) private adminModel: Model<Admin>,
  ) {}

  async topBets(query: MyBetsQueryDto) {
    const current = new Date();
    let lastMonth = new Date();

    if (query.dateSort === DateSort.DAY) {
      lastMonth.setDate(lastMonth.getDate() - 1);
    }

    if (query.dateSort === DateSort.MONTH) {
      lastMonth.setMonth(lastMonth.getMonth() - 1);
    }

    if (query.dateSort === DateSort.YEAR) {
      lastMonth.setFullYear(lastMonth.getFullYear() - 1);
    }

    const bets = await this.betModel
      .find({
        time: {
          $gte: new Date(lastMonth),
          $lte: current,
        },
        win: {
          $exists: true,
        },
      })
      .sort({ "win.USD": -1, time: -1 })
      .skip(query.skip)
      .limit(query.limit);

    return bets;
  }

  async myBets(auth: IAuthPayload, query: MyBetsQueryDto) {
    const bets = await this.betModel.find({ playerId: auth.id }).skip(query.skip).limit(query.limit).sort({ time: -1 });

    return bets;
  }

  async findLastCoeffs() {
    const coeffs = await this.coeffModel.find({}).sort({ createdAt: -1 }).limit(30);

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

    const lastGame = await this.lastGameModel.aggregate([
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
    ]);

    return lastGame[0] || { winAmount: {}, betAmount: {}, bets: [] };
  }
}
