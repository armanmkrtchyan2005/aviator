import { Injectable } from "@nestjs/common";
import { CreatePaymentDto } from "./dto/create-payment.dto";

@Injectable()
export class PaymentService {
  createAAIOPayment(dto: CreatePaymentDto) {
    return {
      method: "AAIO",
      paymentUrl: "/",
    };
  }

  createDonatePayPayment(dto: CreatePaymentDto) {
    return {
      method: "DonatePay",
      paymentUrl: "/",
    };
  }
}
