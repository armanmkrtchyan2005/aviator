import { Body, Controller, Post } from "@nestjs/common";

@Controller("payment")
export class PaymentController {
  @Post("success")
  success(@Body() dto) {
    console.log(dto);
  }
}
