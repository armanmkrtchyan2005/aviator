import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectModel } from "@nestjs/mongoose";
import { Cron, CronExpression, SchedulerRegistry } from "@nestjs/schedule";
import { ApiProperty } from "@nestjs/swagger";
import * as _ from "lodash";
import { Model, PipelineStage } from "mongoose";
import { ConvertService } from "src/convert/convert.service";
import { Replenishment, ReplenishmentStatusEnum } from "src/replenishment/schemas/replenishment.schema";
import { SocketGateway } from "src/socket/socket.gateway";
import { Bonus, CoefParamsType } from "src/user/schemas/bonus.schema";
import { UserPromo } from "src/user/schemas/userPromo.schema";
import { Withdrawal, WithdrawalStatusEnum } from "src/withdrawal/schemas/withdrawal.schema";
import { AdminLoginDto } from "./dto/adminLogin.dto";
import { CancelReplenishmentDto } from "./dto/cancelReplenishment.dto";
import { CreateRequisiteDto } from "./dto/createRequisite.dto";
import { LimitQueryDto } from "./dto/limit-query.dto";
import { AccountRequisite } from "./schemas/account-requisite.schema";
import { Account, AccountDocument, ReplenishmentHistory } from "./schemas/account.schema";
import { Admin } from "./schemas/admin.schema";
import { Requisite } from "./schemas/requisite.schema";

export class ReplenishmentHistoryResponse {
  @ApiProperty()
  address: string;

  @ApiProperty({ isArray: true })
  history: ReplenishmentHistory;
}

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
    @InjectModel(Bonus.name) private bonusModel: Model<Bonus>,
    @InjectModel(UserPromo.name) private userPromoModel: Model<UserPromo>,
    private jwtService: JwtService,
    private convertService: ConvertService,
    private socketGateway: SocketGateway,
    private schedulerRegistry: SchedulerRegistry,
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

    const isEqual = dto.password === account.password;

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

    console.log(account);

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

  async changeRequisiteVerifyCard(account: AccountDocument, id: string) {
    const requisite = await this.accountRequisiteModel.findOne({ _id: id, account: account._id });

    requisite.isCardFileRequired = !requisite.isCardFileRequired;

    await requisite.save();

    return requisite;
  }

  async changeRequisiteVerifyReceipt(account: AccountDocument, id: string) {
    const requisite = await this.accountRequisiteModel.findOne({ _id: id, account: account._id });

    requisite.isReceiptFileRequired = !requisite.isReceiptFileRequired;

    await requisite.save();

    return requisite;
  }

  async getReplenishments(account: Account, dto: LimitQueryDto) {
    const match: any = { account: { $exists: true, $eq: account._id }, isShowing: true };

    if (dto.startDate) {
      match.createdAt = { $gte: dto.startDate };
    }

    if (dto.endDate) {
      const nextDay = new Date(dto.endDate);
      nextDay.setDate(dto.endDate.getDate());
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

    const replenishment = await this.replenishmentModel.findOne({ _id: id, account: account._id }).populate(["user", "requisite"]);

    if (!replenishment) {
      throw new NotFoundException("Нет такой заявки");
    }

    if (replenishment.status == ReplenishmentStatusEnum.COMPLETED) {
      throw new BadRequestException("Вы не можете менять подтвержденную заявку");
    }

    const userAmount = replenishment.amount[replenishment.user.currency] + (replenishment.bonusAmount[replenishment.user.currency] || 0);

    replenishment.user.balance += userAmount;

    const { leader } = await replenishment.user.populate("leader");

    if (leader) {
      const userLeaderAmount = replenishment.amount[leader.currency];
      replenishment.user.sumReplenishment += userLeaderAmount;
    }

    await replenishment.user.save();

    replenishment.status = ReplenishmentStatusEnum.COMPLETED;
    replenishment.completedDate = new Date();

    await replenishment.save();

    const requisiteAmount = replenishment.accrualAmount["USDT"];

    account.requisite.balance -= requisiteAmount;
    account.balance -= requisiteAmount;

    const turnoverAmount = +(replenishment.amount[replenishment.requisite.currency] + replenishment.commission[replenishment.requisite.currency]).toFixed(2);

    replenishment.requisite.turnover.confirmed += turnoverAmount;
    replenishment.requisite.turnover.inProcess -= turnoverAmount;
    replenishment.requisite.turnover.confirmedCount++;
    replenishment.isPayConfirmed = true;

    await replenishment.requisite.save();
    await account.save();

    await this.accountRequisiteModel.findByIdAndUpdate(replenishment.requisite._id, { $set: { turnover: replenishment.requisite.turnover } });

    const bonus = await this.bonusModel.findOne({ "coef_params.type": CoefParamsType.ADD_BALANCE, active: true });

    if (bonus) {
      const isUserPromoFined = await this.userPromoModel.findOne({ user: replenishment.user._id, bonus: bonus._id });

      if (replenishment.amount["USD"] >= bonus.coef_params.from_amount && !isUserPromoFined) {
        const randomAmount = _.random(bonus.coef_params.amount_first, bonus.coef_params.amount_second);
        const amount = await this.convertService.convert("USD", replenishment.user.currency, randomAmount);
        await this.userPromoModel.create({ bonus: bonus._id, user: replenishment.user._id, amount, active: false });
      }
    }

    try {
      this.schedulerRegistry.deleteCronJob(replenishment._id.toString());
    } catch (error) {}

    this.socketGateway.server.to(replenishment.user._id.toString()).emit("replenishment-refresh");
    this.socketGateway.server.to(replenishment.user._id.toString()).emit("user-balance", replenishment.user.balance);

    return { message: "Заявка подтверждена" };
  }

  async cancelReplenishment(account: Account, id: string, dto: CancelReplenishmentDto) {
    const replenishment = await this.replenishmentModel.findOne({ _id: id, account: account._id }).populate(["user", "requisite"]);

    if (!replenishment) {
      throw new NotFoundException("Нет такой заявки");
    }

    if (replenishment.status == ReplenishmentStatusEnum.COMPLETED || replenishment.status == ReplenishmentStatusEnum.CANCELED) {
      throw new BadRequestException("Вы не можете менять заявку");
    }

    replenishment.status = ReplenishmentStatusEnum.CANCELED;
    replenishment.statusMessage = dto.statusMessage;
    replenishment.completedDate = new Date();

    await replenishment.save();

    const turnoverAmount = +(replenishment.amount[replenishment.requisite.currency] + replenishment.commission[replenishment.requisite.currency]).toFixed(2);

    replenishment.requisite.turnover.inProcess -= turnoverAmount;

    await this.accountRequisiteModel.findByIdAndUpdate(replenishment.requisite._id, { $set: { turnover: replenishment.requisite.turnover } });

    try {
      this.schedulerRegistry.deleteCronJob(replenishment._id.toString());
    } catch (error) {}

    this.socketGateway.server.to(replenishment.user._id.toString()).emit("replenishment-refresh");

    return { message: "Заявка отменена" };
  }

  async getWithdrawals(account: Account, dto: LimitQueryDto) {
    const withdrawals = await this.withdrawalModel
      .aggregate([
        { $match: { createdAt: { $gte: dto.startDate, $lte: dto.endDate } } },
        { $lookup: { from: "requisites", localField: "requisite", foreignField: "_id", as: "requisite" } },
        {
          $unwind: "$requisite",
        },
        ...limitAndSkipPipelines(dto),
      ])
      .sort({ createdAt: -1 });

    return withdrawals;
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async autoDeactivateWithdrawals() {
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);
    console.log("One minute", oneHourAgo);

    await this.withdrawalModel.updateMany(
      {
        status: { $eq: WithdrawalStatusEnum.PENDING },
        active: { $ne: null },
        activeAt: { $lte: oneHourAgo },
      },
      { $set: { active: null, activeAt: null } },
    );
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
    withdrawal.activeAt = new Date();

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
    withdrawal.completedDate = new Date();

    account.balance += requisiteAmount;

    await withdrawal.requisite.save();
    await account.save();

    await admin.save();

    await withdrawal.save();

    this.socketGateway.server.to(withdrawal.user._id.toString()).emit("withdrawal-refresh");
    this.socketGateway.server.to(withdrawal.user._id.toString()).emit("user-balance", withdrawal.user.balance);

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

    if (account._id.toString() !== withdrawal.active._id.toString()) {
      throw new BadRequestException("Вы не можете отменить заявку, активированную другим аккаунтом");
    }

    withdrawal.status = WithdrawalStatusEnum.CANCELED;

    withdrawal.statusMessage = dto.statusMessage;

    withdrawal.user.balance += withdrawal.amount[withdrawal.user.currency];

    withdrawal.completedDate = new Date();

    await withdrawal.user.save();

    await withdrawal.save();

    this.socketGateway.server.to(withdrawal.user._id.toString()).emit("withdrawal-refresh");
    this.socketGateway.server.to(withdrawal.user._id.toString()).emit("user-balance", withdrawal.user.balance);

    return { message: "Заявка отменена" };
  }

  async replenishmentHistory(account: Account) {
    return {
      history: _.orderBy(account.replenishmentHistory, "createdAt", "desc"),
    };
  }
}
