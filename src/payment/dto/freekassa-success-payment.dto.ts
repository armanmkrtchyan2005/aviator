import { IsNotEmpty, IsNumber } from "class-validator";

enum FreekassaPaymentMethod {
  FK_WALLET_RUB = 1,
  FK_WALLET_USD = 2,
  FK_WALLET_EUR = 3,
  VISA_RUB = 4,
  YOOMONEY = 6,
  VISA_UAH = 7,
  MASTERCARD_RUB = 8,
  MASTERCARD_UAH = 9,
  QIWI = 10,
  VISA_EUR = 11,
  MIR = 12,
  ONLINE_BANK = 13,
  USDT_ERC20 = 14,
  USDT_TRC20 = 15,
  BITCOIN_CASH = 16,
  BNB = 17,
  DASH = 18,
  DOGECOIN = 19,
  ZCASH = 20,
  MONERO = 21,
  WAVES = 22,
  RIPPLE = 23,
  BITCOIN = 24,
  LITECOIN = 25,
  ETHEREUM = 26,
  STEAMPAY = 27,
  MEGAFON = 28,
  VISA_USD = 32,
  PERFECT_MONEY_USD = 33,
  SHIBA_INU = 34,
  QIWI_API = 35,
  CARD_RUB_API = 36,
  GOOGLE_PAY = 37,
  APPLE_PAY = 38,
  TRON = 39,
  WEBMONEY_WMZ = 40,
  VISA_MASTER_CARD_KZT = 41,
  SBP = 42,
  SBP_API = 44,
}

export class FreekassaSuccessPaymentDto {
  @IsNotEmpty()
  MERCHANT_ID: string;

  @IsNotEmpty()
  @IsNumber()
  AMOUNT: number;

  @IsNotEmpty()
  intid: string;

  @IsNotEmpty()
  MERCHANT_ORDER_ID: string;

  P_EMAIL?: string;

  P_PHONE: string;

  @IsNotEmpty()
  CUR_ID: FreekassaPaymentMethod;

  @IsNotEmpty()
  SIGN: string;

  @IsNotEmpty()
  us_currency: string;
}
