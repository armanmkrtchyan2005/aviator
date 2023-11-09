import { Injectable } from "@nestjs/common";

const CurrencyConverter = require("currency-converter-lt");

let currencyConverter = new CurrencyConverter();

@Injectable()
export class ConvertService {
  async convert(from: string, to: string, amount: number) {
    return await currencyConverter.from(from).to(to).amount(amount).convert();
  }
}
