import { Controller, Get, Query } from "@nestjs/common";
import { ConvertDto } from "./dto/convert.dto";
import { ConvertService } from "./convert.service";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";

@ApiTags("Convert")
@Controller("convert")
export class ConvertController {
  constructor(private convertService: ConvertService) {}

  @ApiOkResponse({ type: Number })
  @Get("")
  convert(@Query() dto: ConvertDto) {
    return this.convertService.convert(dto.from, dto.to, dto.amount);
  }
}
