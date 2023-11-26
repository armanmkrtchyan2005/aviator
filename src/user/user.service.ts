import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { User } from "./schemas/user.schema";
import { Model } from "mongoose";
import { IAuthPayload } from "src/auth/auth.guard";
import { Bet } from "./schemas/bet.schema";
import { ConvertService } from "src/convert/convert.service";

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<User>, @InjectModel(Bet.name) private betModel: Model<Bet>, private convertService: ConvertService) {}

  async findMe(auth: IAuthPayload) {
    const user = await this.userModel.findById(auth.id, { telegramId: true, login: true, referralBalance: true, descendants: true });

    return user;
  }
}
