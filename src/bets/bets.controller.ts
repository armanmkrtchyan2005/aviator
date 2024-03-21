import { Controller, Get, Query, Req } from "@nestjs/common";
import { BetsService, LastBetsResponse } from "./bets.service";
import { MyBetsQueryDto } from "./dto/my-bets-query.dto";
import { Auth } from "src/auth/decorators/auth.decorator";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { Bet } from "./schemas/bet.schema";
import { TopBetsQueryDto } from "./dto/top-bets.query.dto";
import { Game } from "./schemas/game.schema";

@ApiTags("Bets")
@Controller("bets")
export class BetsController {
  constructor(private betsService: BetsService) {}

  @ApiOkResponse({ type: [Bet] })
  @Get("/tops")
  topBets(@Query() query: TopBetsQueryDto) {
    return this.betsService.topBets(query);
  }

  @ApiOkResponse({ type: [Bet] })
  @Auth()
  @Get("/my")
  myBets(@Req() req: Request, @Query() query: MyBetsQueryDto) {
    return this.betsService.myBets(req["user"], query);
  }

  @ApiOkResponse({ type: [Game] })
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
