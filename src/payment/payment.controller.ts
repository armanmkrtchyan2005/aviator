import { BadRequestException, Body, Controller, Post, Req } from "@nestjs/common";
import { ApiExcludeController } from "@nestjs/swagger";
import { AAIOSuccessPaymentDto } from "./dto/aaio-success-payment.dto";
import { PaymentService } from "./payment.service";
import { Request } from "express";
import { FreekassaSuccessPaymentDto } from "./dto/freekassa-success-payment.dto";

@ApiExcludeController()
@Controller("payment")
export class PaymentController {
  constructor(private paymentService: PaymentService) {}

  @Post("aaio/success")
  successPaymentAAIO(@Req() req: Request, @Body() dto: AAIOSuccessPaymentDto) {
    console.log(req.clientIp);

    if (req.clientIp !== process.env.AAIO_SERVER_IP) {
      throw new BadRequestException("hacking attempt");
    }

    console.log(dto);

    return this.paymentService.successPaymentAAIO(dto);
  }

  @Post("freekassa/success")
  successPaymentFreekassa(@Req() req: Request, @Body() dto: FreekassaSuccessPaymentDto) {
    console.log(req.clientIp);

    if (!process.env.FREEKASSA_SERVER_IPS.split(" ").includes(req.clientIp)) {
      throw new BadRequestException("hacking attempt");
    }

    return this.paymentService.successPaymentFreekassa(dto);
  }
}
