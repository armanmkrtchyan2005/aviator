import { Controller, Get, Query, Req } from "@nestjs/common";
import { BetsService } from "./bets.service";
import { MyBetsQueryDto } from "./dto/my-bets-query.dto";
import { Auth } from "src/auth/decorators/auth.decorator";

@Controller("bets")
export class BetsController {
  constructor(private betsService: BetsService) {}

  @Get("/tops")
  topBets() {
    return this.betsService.topBets();
  }

  @Get("/my")
  @Auth()
  myBets(@Req() req: Request, @Query() query: MyBetsQueryDto) {
    return this.betsService.myBets(req["user"], query);
  }
}
