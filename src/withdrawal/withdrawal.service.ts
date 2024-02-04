import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Requisite } from "src/admin/schemas/requisite.schema";
import { User } from "src/user/schemas/user.schema";
import { Withdrawal, WithdrawalStatusEnum } from "./schemas/withdrawal.schema";
import { IAuthPayload } from "src/auth/auth.guard";
import { CreateWithdrawalDto } from "./dto/createWithdrawal.dto";
import { Admin } from "src/admin/schemas/admin.schema";
import { ConvertService } from "src/convert/convert.service";

@Injectable()
export class WithdrawalService {
  constructor(
    @InjectModel(Admin.name) private adminModel: Model<Admin>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Requisite.name) private requisiteModel: Model<Requisite>,
    @InjectModel(Withdrawal.name) private withdrawalModel: Model<Withdrawal>,
    private convertService: ConvertService,
  ) {}

  async findAll(userPayload: IAuthPayload) {
    const withdrawals = await this.withdrawalModel
      .find({
        user: userPayload.id,
      })
      .populate("requisite");

    return withdrawals;
  }

  async createWithdrawal(userPayload: IAuthPayload, dto: CreateWithdrawalDto) {
    const user = await this.userModel.findById(userPayload.id);
    const requisite = await this.requisiteModel.findById(dto.requisite);

    if (!requisite) {
      throw new NotFoundException({ message: "Реквизит не найден" });
    }

    const balance = await this.convertService.convert(dto.currency, user.currency, dto.amount);

    if (balance > user.balance) {
      throw new BadRequestException({ message: "Недостаточно средств на балансе!" });
    }

    const withdrawal = await this.withdrawalModel.create({ ...dto, user: user._id });

    user.balance -= balance;

    await user.save();

    return withdrawal;
  }

  async cancelWithdrawal(id: string) {
    const withdrawal = await this.withdrawalModel.findById(id).populate("user");

    if (withdrawal.status == WithdrawalStatusEnum.CANCELED || withdrawal.status === WithdrawalStatusEnum.COMPLETED) {
      throw new BadRequestException({ message: "Вы не можете изменить статус" });
    }

    withdrawal.status = WithdrawalStatusEnum.CANCELED;
    withdrawal.statusMessage = "Отменена пользователем";

    const amount = await this.convertService.convert(withdrawal.currency, withdrawal.user.currency, withdrawal.amount);

    withdrawal.user.balance += amount;
    await withdrawal.save();

    return { message: "Пополнение отменена" };
  }
}
