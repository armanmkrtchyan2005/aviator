import { BadRequestException, Body, Controller, Ip, Post, Req } from "@nestjs/common";
import { ApiExcludeController } from "@nestjs/swagger";
import { SuccessPaymentDto } from "./dto/success-payment.dto";
import { PaymentService } from "./payment.service";
import { Request } from "express";

@ApiExcludeController()
@Controller("payment")
export class PaymentController {
  constructor(private paymentService: PaymentService) {}

  @Post("aaio/success")
  successPaymentAAIO(@Req() req: Request, @Body() dto: SuccessPaymentDto) {
    console.log(req.clientIp);

    if (req.clientIp !== process.env.AAIO_SERVER_IP) {
      throw new BadRequestException("hacking attempt");
    }

    return this.paymentService.successPaymentAAIO(dto);
  }
}
