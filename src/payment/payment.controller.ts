import { Body, Controller, Post } from "@nestjs/common";
import { ApiExcludeController } from "@nestjs/swagger";

@ApiExcludeController()
@Controller("payment")
export class PaymentController {
  @Post("success")
  success(@Body() dto: any) {
    console.log(dto);
  }
}
