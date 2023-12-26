import { Controller, Get, Query, Req } from "@nestjs/common";
import { BetsService } from "./bets.service";
import { MyBetsQueryDto } from "./dto/my-bets-query.dto";
import { Auth } from "src/auth/decorators/auth.decorator";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { Bet } from "./schemas/bet.schema";

@ApiTags("Bets")
@Controller("bets")
export class BetsController {
  constructor(private betsService: BetsService) {}

  @ApiOkResponse({ type: [Bet] })
  @Get("/tops")
  topBets(@Query() query: MyBetsQueryDto) {
    return this.betsService.topBets(query);
  }

  @ApiOkResponse({ type: [Bet] })
  @Get("/my")
  @Auth()
  myBets(@Req() req: Request, @Query() query: MyBetsQueryDto) {
    return this.betsService.myBets(req["user"], query);
  }
}
