import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Admin } from "src/admin/schemas/admin.schema";
import { Requisite } from "src/admin/schemas/requisite.schema";
import { IAuthPayload } from "src/auth/auth.guard";
import { IAmount } from "src/bets/schemas/bet.schema";
import { ConvertService } from "src/convert/convert.service";
import { Replenishment, ReplenishmentStatusEnum } from "src/replenishment/schemas/replenishment.schema";
import { Limit, LimitType } from "src/user/schemas/limit.schema";
import { User } from "src/user/schemas/user.schema";
import { CreateWithdrawalDto } from "./dto/createWithdrawal.dto";
import { Withdrawal, WithdrawalStatusEnum } from "./schemas/withdrawal.schema";

@Injectable()
export class WithdrawalService {
  constructor(
    @InjectModel(Admin.name) private adminModel: Model<Admin>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Requisite.name) private requisiteModel: Model<Requisite>,
    @InjectModel(Withdrawal.name) private withdrawalModel: Model<Withdrawal>,
    @InjectModel(Replenishment.name) private replenishmentModel: Model<Replenishment>,
    @InjectModel(Limit.name) private limitModel: Model<Limit>,
    private convertService: ConvertService,
  ) {}

  async findLimits(userPayload: IAuthPayload, requisiteId: string) {
    const user = await this.userModel.findById(userPayload.id);
    const requisite = await this.requisiteModel.findById(requisiteId);

    const min = requisite.withdrawalLimit.min;
    const max = requisite.withdrawalLimit.max;

    const minLimit = await this.convertService.convert(requisite.currency, user.currency, min);
    const maxLimit = await this.convertService.convert(requisite.currency, user.currency, max);

    return { minLimit, maxLimit, currency: user.currency, minSymbols: requisite.min_symbols_count, maxSymbols: requisite.max_symbols_count };
  }

  async findAll(userPayload: IAuthPayload) {
    const withdrawals = await this.withdrawalModel
      .find({
        user: userPayload.id,
      })
      .populate("requisite")
      .sort({ createdAt: -1 });

    return withdrawals;
  }

  async createWithdrawal(userPayload: IAuthPayload, dto: CreateWithdrawalDto) {
    const admin = await this.adminModel.findOne();
    const user = await this.userModel.findById(userPayload.id).populate("leader");
    const requisite = await this.requisiteModel.findOne({ _id: dto.requisite, active: true });

    if (!requisite) {
      throw new NotFoundException({ message: "Реквизит не найден" });
    }

    if (dto.userRequisite.length < requisite.min_symbols_count && dto.userRequisite.length > requisite.max_symbols_count) {
      throw new BadRequestException(`Длина реквизита должен быть в диапазоне от ${requisite.min_symbols_count} до ${requisite.max_symbols_count}`);
    }

    if (user.banned) {
      const limit = await this.limitModel.findOne({ id: userPayload.id, type: LimitType.BLOCKED }).sort({ createdAt: "desc" });

      throw new BadRequestException(`Вывод средств ограничен. Причина ограничений: ${limit.reason}. Для оспаривания ограничений обратитесь к администрации.`);
    }

    const [replenishment] = await this.replenishmentModel.aggregate([
      { $match: { user: user._id, status: ReplenishmentStatusEnum.COMPLETED, isWithdrawalAllowed: false } },
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

    console.log("total:", total);

    const betAmount = total - user.playedAmount;

    console.log("playedAmount:", user.playedAmount);

    if (betAmount > 0) {
      throw new BadRequestException(
        `Для вывода средств вам необходимо сделать ставку как минимум на сумму ${betAmount} ${user.currency}, забрав её с минимальным коэффициентом 1.2Х`,
      );
    }

    user.isWithdrawalAllowed = true;
    user.playedAmount = 0;

    const amount: IAmount = {};
    const limits: { min: IAmount; max: IAmount } = { min: {}, max: {} };

    for (const currency of admin.currencies) {
      amount[currency] = await this.convertService.convert(dto.currency, currency, dto.amount);
      limits.min[currency] = await this.convertService.convert(requisite.currency, currency, requisite.withdrawalLimit.min);
      limits.max[currency] = await this.convertService.convert(requisite.currency, currency, requisite.withdrawalLimit.max);
    }

    if (amount[requisite.currency] < limits.min[requisite.currency]) {
      throw new BadRequestException({ message: `Сумма вывода должна быть више от ${limits.min[user.currency]} ${user.currency}` });
    }

    if (amount[requisite.currency] > limits.max[requisite.currency]) {
      throw new BadRequestException({ message: `Сумма вывода должна быть ниже от ${limits.max[user.currency]} ${user.currency}` });
    }

    if (amount[user.currency] > user.balance) {
      throw new BadRequestException({ message: "Недостаточно средств на балансе!" });
    }

    await this.replenishmentModel.updateMany(
      { user: user._id, status: ReplenishmentStatusEnum.COMPLETED },
      {
        $set: {
          isWithdrawalAllowed: true,
        },
      },
    );

    const withdrawal = await this.withdrawalModel.create({ ...dto, amount, user: user._id });

    user.balance -= amount[user.currency];

    if (user.leader) {
      user.sumWithdrawal += amount[user.leader.currency];
    }

    await user.save();

    return withdrawal;
  }

  async cancelWithdrawal(id: string) {
    const withdrawal = await this.withdrawalModel.findById(id).populate("user");

    if (withdrawal.status == WithdrawalStatusEnum.CANCELED || withdrawal.status === WithdrawalStatusEnum.COMPLETED || withdrawal.active) {
      throw new BadRequestException({ message: "Невозможно отменить эту заявку. Обратитесь к администрации" });
    }
    withdrawal.status = WithdrawalStatusEnum.CANCELED;
    withdrawal.statusMessage = "Отменена пользователем";

    withdrawal.user.balance += withdrawal.amount[withdrawal.user.currency];

    withdrawal.completedDate = new Date();

    await withdrawal.user.save();
    await withdrawal.save();

    return { message: "Заявка на вывод отменена" };
  }
}
