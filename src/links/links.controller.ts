import { Controller, Get } from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { LinksService } from "./links.service";
import { LinksResponse } from "./responses/links.response";

@ApiTags("Links")
@Controller("links")
export class LinksController {
  constructor(private linksService: LinksService) {}

  @ApiOkResponse({ type: LinksResponse })
  @Get("/")
  links() {
    return this.linksService.links();
  }
}
