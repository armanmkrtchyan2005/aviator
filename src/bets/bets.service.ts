import { Injectable } from "@nestjs/common";
import { IAuthPayload } from "src/auth/auth.guard";
import { MyBetsQueryDto } from "./dto/my-bets-query.dto";
import { InjectModel } from "@nestjs/mongoose";
import { User } from "src/user/schemas/user.schema";
import { Model } from "mongoose";
import { Bet } from "./schemas/bet.schema";

@Injectable()
export class BetsService {
  constructor(@InjectModel(User.name) private userModel: Model<User>, @InjectModel(Bet.name) private betModel: Model<Bet>) {}

  async topBets() {}

  async myBets(auth: IAuthPayload, query: MyBetsQueryDto) {
    const bets = await this.betModel.find({ player: auth.id }).skip(query.skip).limit(query.limit).sort({ time: -1 });

    return bets;
  }
}
