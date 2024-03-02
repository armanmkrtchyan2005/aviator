import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Admin } from "./schemas/admin.schema";
import { Model, PipelineStage } from "mongoose";
import { AdminLoginDto } from "./dto/adminLogin.dto";
import { JwtService } from "@nestjs/jwt";
import { Requisite } from "./schemas/requisite.schema";
import { CreateRequisiteDto } from "./dto/createRequisite.dto";
import { Replenishment, ReplenishmentStatusEnum } from "src/replenishment/schemas/replenishment.schema";
import { ConvertService } from "src/convert/convert.service";
import { Withdrawal, WithdrawalStatusEnum } from "src/withdrawal/schemas/withdrawal.schema";
import { CancelReplenishmentDto } from "./dto/cancelReplenishment.dto";
import { LimitQueryDto } from "./dto/limit-query.dto";
import { Account, AccountDocument } from "./schemas/account.schema";
import * as bcrypt from "bcrypt";
import { AccountRequisite } from "./schemas/account-requisite.schema";

function limitAndSkipPipelines(dto: LimitQueryDto) {
  const arrPipelines: PipelineStage[] = [];

  if (dto.limit) {
    arrPipelines.push({ $limit: dto.limit });
  }

  if (dto.skip) {
    arrPipelines.push({ $skip: dto.skip });
  }

  return arrPipelines;
}

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(Admin.name) private adminModel: Model<Admin>,
    @InjectModel(Account.name) private accountModel: Model<Account>,
    @InjectModel(Replenishment.name) private replenishmentModel: Model<Replenishment>,
    @InjectModel(Requisite.name) private requisiteModel: Model<Requisite>,
    @InjectModel(AccountRequisite.name) private accountRequisiteModel: Model<AccountRequisite>,
    @InjectModel(Withdrawal.name) private withdrawalModel: Model<Withdrawal>,
    private jwtService: JwtService,
    private convertService: ConvertService,
  ) {}

  async adminDetails(account: AccountDocument) {
    account = await account.populate("requisite");
    return account;
  }

  async login(dto: AdminLoginDto) {
    const account = await this.accountModel.findOne({ login: dto.login });

    if (!account) {
      throw new BadRequestException("Неправильный логин или пароль");
    }

    const isEqual = bcrypt.compareSync(dto.password, account.password);

    if (!isEqual) {
      throw new BadRequestException("Неправильный логин или пароль");
    }

    const token = this.jwtService.sign({ id: account._id });

    return { token };
  }

  async createRequisite(account: AccountDocument, dto: CreateRequisiteDto) {
    account = await account.populate(["requisites", "requisite"]);
    const isRequisiteFounded = account.requisites.some(requisite => requisite.requisite === dto.requisite);

    if (isRequisiteFounded) {
      throw new BadRequestException("Такой реквизит уже существует");
    }

    const requisite = await this.accountRequisiteModel.create({ requisite: dto.requisite, account: account._id, currency: account.requisite.currency });

    account.requisites.push(requisite);

    await account.save();

    return requisite;
  }

  async getRequisites(account: AccountDocument) {
    account = await account.populate("requisites");

    return account.requisites;
  }

  async changeRequisite(account: AccountDocument, id: string) {
    const requisite = await this.accountRequisiteModel.findOne({ _id: id, account: account._id });

    if (!requisite) {
      throw new NotFoundException("Реквизит не найден");
    }

    const activeCount = await this.accountRequisiteModel.count({ account: account._id, active: true });

    if (requisite.active) {
      // Deactivating a requisite
      requisite.active = false;
    } else {
      // Activating a requisite
      if (activeCount >= 5) {
        throw new BadRequestException("Одновременна активных реквизитов может быть до 5 карт");
      }

      requisite.active = true;
    }

    await requisite.save();

    return requisite;
  }

  async getReplenishments(account: Account, dto: LimitQueryDto) {
    const match: any = { account: account._id };

    if (dto.startDate) {
      match.createdAt = { $gte: dto.startDate };
    }

    if (dto.endDate) {
      const nextDay = new Date(dto.endDate);
      nextDay.setDate(dto.endDate.getDate() + 1);
      match.createdAt = { ...match.createdAt, $lt: nextDay };
    }

    const replenishments = await this.replenishmentModel
      .aggregate([
        { $match: match },
        { $lookup: { from: "accountrequisites", localField: "requisite", foreignField: "_id", as: "requisite" } },
        {
          $unwind: "$requisite",
        },
        ...limitAndSkipPipelines(dto),
      ])
      .sort({ createdAt: -1 });

    return replenishments;
  }

  async confirmReplenishment(account: AccountDocument, id: string) {
    account = await account.populate("requisite");

    const admin = await this.adminModel.findOne({}, ["manual_methods_balance"]);
    const replenishment = await this.replenishmentModel.findOne({ _id: id, account: account._id }).populate(["user", "requisite"]);

    if (!replenishment) {
      throw new NotFoundException("Нет такой заявки");
    }

    if (replenishment.status == ReplenishmentStatusEnum.COMPLETED) {
      throw new BadRequestException("Вы не можете менять подтвержденную заявку");
    }

    replenishment.user.balance += replenishment.amount[replenishment.user.currency];

    await replenishment.user.save();

    replenishment.status = ReplenishmentStatusEnum.COMPLETED;

    await replenishment.save();

    const requisiteAmount = replenishment.deduction["USDT"] + (replenishment.deduction["USDT"] * account.replenishmentBonus) / 100;

    account.requisite.balance -= requisiteAmount;
    account.balance -= requisiteAmount;
    admin.manual_methods_balance -= requisiteAmount;

    await replenishment.requisite.save();
    await account.save();

    await admin.save();

    return { message: "Заявка подтверждена" };
  }

  async cancelReplenishment(account: Account, id: string, dto: CancelReplenishmentDto) {
    const replenishment = await this.replenishmentModel.findOne({ _id: id, requisite: account.requisite }).populate("user");

    if (!replenishment) {
      throw new NotFoundException("Нет такой заявки");
    }

    if (replenishment.status == ReplenishmentStatusEnum.COMPLETED || replenishment.status == ReplenishmentStatusEnum.CANCELED) {
      throw new BadRequestException("Вы не можете менять заявку");
    }

    replenishment.status = ReplenishmentStatusEnum.CANCELED;

    replenishment.statusMessage = dto.statusMessage;

    await replenishment.save();

    return { message: "Заявка отменена" };
  }

  async getWithdrawals(account: Account, dto: LimitQueryDto) {
    const withdrawals = await this.withdrawalModel
      .aggregate([
        { $lookup: { from: "requisites", localField: "requisite", foreignField: "_id", as: "requisite" } },
        {
          $unwind: "$requisite",
        },
        ...limitAndSkipPipelines(dto),
      ])
      .sort({ createdAt: -1 });

    return withdrawals;
  }

  async activateWithdrawal(account: AccountDocument, id: string) {
    const withdrawal = await this.withdrawalModel.findById(id);

    if (withdrawal.status === WithdrawalStatusEnum.CANCELED || withdrawal.status === WithdrawalStatusEnum.COMPLETED) {
      throw new BadRequestException("Вы не можете активировать подтверждённую или отменённую заявку");
    }

    if (withdrawal.active) {
      throw new BadRequestException("Это заявка уже была активирована");
    }

    withdrawal.active = account;

    await withdrawal.save();

    return { message: "Заявка активирована" };
  }

  async confirmWithdrawal(account: AccountDocument, id: string) {
    const admin = await this.adminModel.findOne({}, ["manual_methods_balance"]);
    const withdrawal = await this.withdrawalModel.findOne({ _id: id, active: account._id }).populate(["requisite", "active"]);

    if (!withdrawal) {
      throw new NotFoundException("Нет такой заявки");
    }

    if (withdrawal.status == WithdrawalStatusEnum.COMPLETED) {
      throw new BadRequestException("Это заявка уже была подтверждена");
    }

    if (account._id.toString() !== withdrawal.active._id.toString()) {
      throw new BadRequestException("Вы не можете подтверждать заявку, активированную другим аккаунтом");
    }

    withdrawal.status = WithdrawalStatusEnum.COMPLETED;

    const requisiteAmount = withdrawal.amount["USDT"] + (withdrawal.amount["USDT"] * account.withdrawalBonus) / 100;

    withdrawal.requisite.balance += requisiteAmount;
    account.balance += requisiteAmount;
    admin.manual_methods_balance += requisiteAmount;

    await withdrawal.requisite.save();
    await account.save();

    await admin.save();

    await withdrawal.save();

    return { message: "Заявка подтверждена" };
  }

  async cancelWithdrawal(account: Account, id: string, dto: CancelReplenishmentDto) {
    const withdrawal = await this.withdrawalModel.findOne({ _id: id, active: account._id }).populate(["user", "active"]);

    if (!withdrawal) {
      throw new NotFoundException("Нет такой заявки");
    }

    if (withdrawal.status == WithdrawalStatusEnum.COMPLETED || withdrawal.status == WithdrawalStatusEnum.CANCELED) {
      throw new BadRequestException("Вы не можете отменить уже подтверждённую или отменённую заявку");
    }

    if (account._id !== withdrawal.active._id) {
      throw new BadRequestException("Вы не можете отменить заявку, активированную другим аккаунтом");
    }

    withdrawal.status = WithdrawalStatusEnum.CANCELED;

    withdrawal.statusMessage = dto.statusMessage;

    withdrawal.user.balance += withdrawal.amount[withdrawal.user.currency];

    await withdrawal.user.save();

    await withdrawal.save();

    return { message: "Заявка отменена" };
  }
}
