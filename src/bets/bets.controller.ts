import { Controller, Get, Query, Req } from "@nestjs/common";
import { BetsService, LastBetsResponse } from "./bets.service";
import { MyBetsQueryDto } from "./dto/my-bets-query.dto";
import { Auth } from "src/auth/decorators/auth.decorator";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { Bet } from "./schemas/bet.schema";
import { Coeff } from "./schemas/coeff.schema";
import { LastGame } from "./schemas/lastGame.schema";

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
  @Auth()
  @Get("/my")
  myBets(@Req() req: Request, @Query() query: MyBetsQueryDto) {
    return this.betsService.myBets(req["user"], query);
  }

  @ApiOkResponse({ type: [Coeff] })
  @Get("/coeffs")
  findLastCoeffs() {
    return this.betsService.findLastCoeffs();
  }

  @ApiOkResponse({ type: LastBetsResponse })
  @Get("/last-game")
  findLastGame() {
    return this.betsService.findLastGame();
  }
}
