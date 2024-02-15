import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Admin } from "./schemas/admin.schema";
import { Model } from "mongoose";
import { AdminLoginDto } from "./dto/adminLogin.dto";
import { JwtService } from "@nestjs/jwt";
import { Requisite } from "./schemas/requisite.schema";
import { CreateRequisiteDto } from "./dto/createRequisite.dto";
import { Replenishment, ReplenishmentStatusEnum } from "src/replenishment/schemas/replenishment.schema";
import { ConvertService } from "src/convert/convert.service";
import { Withdrawal, WithdrawalStatusEnum } from "src/withdrawal/schemas/withdrawal.schema";
import { CancelReplenishmentDto } from "./dto/cancelReplenishment.dto";
import { LimitQueryDto } from "./dto/limit-query.dto";
import { Account } from "./schemas/account.schema";
import * as bcrypt from "bcrypt";

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(Admin.name) private adminModel: Model<Admin>,
    @InjectModel(Account.name) private accountModel: Model<Account>,
    @InjectModel(Replenishment.name) private replenishmentModel: Model<Replenishment>,
    @InjectModel(Requisite.name) private requisiteModel: Model<Requisite>,
    @InjectModel(Withdrawal.name) private withdrawalModel: Model<Withdrawal>,
    private jwtService: JwtService,
    private convertService: ConvertService,
  ) {}

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
  //------------------- Harcnel Karenin -----------------
  async createRequisite(dto: CreateRequisiteDto) {
    const requisite = await this.requisiteModel.findOne({ requisite: dto.requisite });

    if (requisite) {
      throw new BadRequestException("Такой реквизит уже существует");
    }

    const newRequisite = await this.requisiteModel.create(dto);

    return newRequisite;
  }

  //------------------- Harcnel Karenin -----------------
  async getRequisites() {
    const requisites = await this.requisiteModel.find();

    return requisites;
  }

  async getReplenishments(account: Account, dto: LimitQueryDto) {
    const replenishments = await this.replenishmentModel
      .aggregate([
        { $match: { requisite: account.requisite } },
        { $addFields: { _id: { $toString: "$_id" } } },
        {
          $match: { _id: { $regex: dto.q, $options: "i" } },
        },
      ])
      .limit(dto.limit)
      .skip(dto.skip)
      .sort({ createdAt: -1 });

    return replenishments;
  }

  async confirmReplenishment(account: Account, id: string) {
    const admin = await this.adminModel.findOne({}, ["manual_methods_balance"]);
    const replenishment = await this.replenishmentModel.findOne({ _id: id, requisite: account.requisite }).populate(["user", "requisite"]);

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

    const requisiteAmount = replenishment.deduction[replenishment.requisite.currency];

    replenishment.requisite.balance += requisiteAmount;

    await replenishment.requisite.save();

    admin.manual_methods_balance += requisiteAmount;

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
        { $match: { requisite: account.requisite } },
        { $addFields: { _id: { $toString: "$_id" } } },
        {
          $match: { _id: { $regex: dto.q, $options: "i" } },
        },
      ])
      .limit(dto.limit)
      .skip(dto.skip)
      .sort({ createdAt: -1 });

    return withdrawals;
  }

  async confirmWithdrawal(account: Account, id: string) {
    const withdrawal = await this.withdrawalModel.findOne({ _id: id, requisite: account.requisite }).populate("requisite");

    if (!withdrawal) {
      throw new NotFoundException("Нет такой заявки");
    }

    if (withdrawal.status == WithdrawalStatusEnum.COMPLETED) {
      throw new BadRequestException("Вы не можете менять подтвержденную заявку");
    }

    withdrawal.status = WithdrawalStatusEnum.COMPLETED;

    await withdrawal.save();

    return { message: "Заявка подтверждена" };
  }

  async cancelWithdrawal(account: Account, id: string, dto: CancelReplenishmentDto) {
    const withdrawal = await this.withdrawalModel.findById(id).populate("user");

    if (!withdrawal) {
      throw new NotFoundException("Нет такой заявки");
    }

    if (withdrawal.status == WithdrawalStatusEnum.COMPLETED || withdrawal.status == WithdrawalStatusEnum.CANCELED) {
      throw new BadRequestException("Вы не можете менять заявку");
    }

    withdrawal.status = WithdrawalStatusEnum.CANCELED;

    withdrawal.statusMessage = dto.statusMessage;

    withdrawal.user.balance += await this.convertService.convert(withdrawal.currency, withdrawal.user.currency, withdrawal.amount);

    await withdrawal.user.save();

    await withdrawal.save();

    return { message: "Заявка отменена" };
  }
}
