import { RequisiteDocument } from "src/admin/schemas/requisite.schema";
import { IAmount } from "src/bets/schemas/bet.schema";
import { CreateReplenishmentDto } from "src/replenishment/dto/create-replenishment.dto";
import { UserDocument } from "src/user/schemas/user.schema";

export class CreatePaymentDto {
  user: UserDocument;

  amount: IAmount;

  requisite: RequisiteDocument;

  bonusAmount: IAmount;
}
