import { Controller, Get } from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { LinksService } from "./links.service";

@ApiTags("Links")
@Controller("links")
export class LinksController {
  constructor(private linksService: LinksService) {}

  @ApiOkResponse({ schema: { type: "object", properties: { link: { type: "string", example: "https://example.com" } } } })
  @Get("/support")
  support() {
    return this.linksService.support();
  }
}
