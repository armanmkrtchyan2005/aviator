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
import { isCreditCard } from "class-validator";
import { IAmount } from "src/bets/schemas/bet.schema";
import { Replenishment, ReplenishmentStatusEnum } from "src/replenishment/schemas/replenishment.schema";

@Injectable()
export class WithdrawalService {
  constructor(
    @InjectModel(Admin.name) private adminModel: Model<Admin>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Requisite.name) private requisiteModel: Model<Requisite>,
    @InjectModel(Withdrawal.name) private withdrawalModel: Model<Withdrawal>,
    @InjectModel(Replenishment.name) private replenishmentModel: Model<Replenishment>,
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
    const admin = await this.adminModel.findOne();
    const user = await this.userModel.findById(userPayload.id);
    const requisite = await this.requisiteModel.findOne({ _id: dto.requisite, active: true });

    if (!requisite) {
      throw new NotFoundException({ message: "Реквизит не найден" });
    }

    if (dto.userRequisite.length < requisite.min_symbols_count && dto.userRequisite.length > requisite.max_symbols_count) {
      throw new BadRequestException(`Длина реквизита должен быть в диапазоне от ${requisite.min_symbols_count} до ${requisite.max_symbols_count}`);
    }

    const [replenishment] = await this.replenishmentModel.aggregate([
      { $match: { user: user._id, status: ReplenishmentStatusEnum.COMPLETED } },
      { $group: { _id: null, total: { $sum: `$amount.${user.currency}` } } },
      {
        $project: {
          total: { $divide: ["$total", 2] },
        },
      },
    ]);
    let total = 0;
    if (replenishment) {
      total = replenishment.total;
    }

    const betAmount = total - user.playedAmount;

    if (!user.isWithdrawalAllowed && betAmount > 0) {
      throw new BadRequestException(`Для вывода денег вы должны делать ставку как минимум ${betAmount} ${user.currency}`);
    }

    user.isWithdrawalAllowed = true;
    user.playedAmount = 0;

    const amount: IAmount = {};

    for (const currency of admin.currencies) {
      amount[currency] = await this.convertService.convert(dto.currency, currency, dto.amount);
    }

    if (amount[requisite.currency] < requisite.withdrawalLimit.min) {
      throw new BadRequestException({ message: `Сумма вывода должна быть више от ${requisite.withdrawalLimit.min} ${requisite.currency}` });
    }

    if (amount[requisite.currency] > requisite.withdrawalLimit.max) {
      throw new BadRequestException({ message: `Сумма вывода должна быть ниже от ${requisite.withdrawalLimit.max} ${requisite.currency}` });
    }

    if (amount[user.currency] > user.balance) {
      throw new BadRequestException({ message: "Недостаточно средств на балансе!" });
    }

    const withdrawal = await this.withdrawalModel.create({ ...dto, amount, user: user._id });

    user.balance -= amount[user.currency];

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

    withdrawal.user.balance += withdrawal.amount[withdrawal.user.currency];

    await withdrawal.user.save();
    await withdrawal.save();

    return { message: "Пополнение отменена" };
  }
}
