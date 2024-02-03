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

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(Admin.name) private adminModel: Model<Admin>,
    @InjectModel(Replenishment.name) private replenishmentModel: Model<Replenishment>,
    @InjectModel(Requisite.name) private requisiteModel: Model<Requisite>,
    @InjectModel(Withdrawal.name) private withdrawalModel: Model<Withdrawal>,
    private jwtService: JwtService,
    private convertService: ConvertService,
  ) { }

  async login(dto: AdminLoginDto) {
    await this.adminModel.create();
    const adminData = await this.adminModel.findOne();

    const admin = adminData.admin_panel_data.find(admin => admin.login === dto.login);

    if (!admin) {
      throw new BadRequestException("Неправильный логин или пароль");
    }

    if (admin.password !== dto.password) {
      throw new BadRequestException("Неправильный логин или пароль");
    }

    const token = this.jwtService.sign({ id: admin.id });

    return { token };
  }

  async createRequisite(dto: CreateRequisiteDto) {
    const requisite = await this.requisiteModel.findOne({ requisite: dto.requisite });

    if (requisite) {
      throw new BadRequestException("Такой реквизит уже существует");
    }

    const newRequisite = await this.requisiteModel.create(dto);

    return newRequisite;
  }

  async getRequisites() {
    const requisites = await this.requisiteModel.find();

    return requisites;
  }

  async getReplenishments() {
    const replenishments = await this.replenishmentModel.find().sort({ createdAt: -1 }).populate("requisite");

    return replenishments;
  }

  async confirmReplenishment(id: string) {
    const replenishment = await this.replenishmentModel.findById(id).populate("user");

    if (!replenishment) {
      throw new NotFoundException("Нет такой заявки");
    }

    if (replenishment.status == ReplenishmentStatusEnum.COMPLETED) {
      throw new BadRequestException("Вы не можете менять подтвержденную заявку");
    }

    replenishment.user.balance += await this.convertService.convert(replenishment.currency, replenishment.user.currency, replenishment.amount);

    await replenishment.user.save();

    replenishment.status = ReplenishmentStatusEnum.COMPLETED;

    await replenishment.save();

    return { message: "Заявка подтверждена" };
  }

  async cancelReplenishment(id: string, dto: CancelReplenishmentDto) {
    const replenishment = await this.replenishmentModel.findById(id).populate("user");

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

  async getWithdrawals() {
    const withdrawals = await this.withdrawalModel.find().sort({ createdAt: -1 });

    return withdrawals;
  }

  async confirmWithdrawal(id: string) {
    const withdrawal = await this.withdrawalModel.findById(id);

    if (!withdrawal) {
      throw new NotFoundException("Нет такой заявки");
    }

    if (withdrawal.status == WithdrawalStatusEnum.COMPLETED) {
      throw new BadRequestException("Вы не можете менять подтвержденную заявку");
    }

    withdrawal.user.balance += await this.convertService.convert(withdrawal.currency, withdrawal.user.currency, withdrawal.amount);

    await withdrawal.user.save();

    withdrawal.status = WithdrawalStatusEnum.COMPLETED;

    await withdrawal.save();

    return { message: "Заявка подтверждена" };
  }

  async cancelWithdrawal(id: string, dto: CancelReplenishmentDto) {
    const withdrawal = await this.withdrawalModel.findById(id);

    if (!withdrawal) {
      throw new NotFoundException("Нет такой заявки");
    }

    if (withdrawal.status == WithdrawalStatusEnum.COMPLETED || withdrawal.status == WithdrawalStatusEnum.CANCELED) {
      throw new BadRequestException("Вы не можете менять заявку");
    }

    withdrawal.status = WithdrawalStatusEnum.CANCELED;

    withdrawal.statusMessage = dto.statusMessage;

    await withdrawal.save();

    return { message: "Заявка отменена" };
  }
}
