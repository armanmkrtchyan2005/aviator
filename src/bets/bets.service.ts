import { Injectable } from "@nestjs/common";
import { IAuthPayload } from "src/auth/auth.guard";
import { MyBetsQueryDto } from "./dto/my-bets-query.dto";
import { InjectModel } from "@nestjs/mongoose";
import { User } from "src/user/schemas/user.schema";
import { Model } from "mongoose";
import { Bet } from "./schemas/bet.schema";
import { Coeff } from "./schemas/coeff.schema";

@Injectable()
export class BetsService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Bet.name) private betModel: Model<Bet>,
    @InjectModel(Coeff.name) private coeffModel: Model<Coeff>,
  ) {}

  async topBets(query: MyBetsQueryDto) {
    const current = new Date();
    let lastMonth = new Date();

    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const bets = await this.betModel
      .find({
        time: {
          $gte: new Date(lastMonth),
          $lte: current,
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
}
