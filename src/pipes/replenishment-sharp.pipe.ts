import { BadRequestException, Injectable, PipeTransform } from "@nestjs/common";
import * as path from "path";
import * as sharp from "sharp";

@Injectable()
export class ReplenishmentSharpPipe implements PipeTransform<Express.Multer.File, Promise<string>> {
  async transform(file: Express.Multer.File): Promise<string> {
    const filename = Date.now() + ".webp";

    const filePath = path.join("uploads", "profile-images", filename);
    await sharp(file.buffer).webp({ effort: 3 }).withMetadata().toFile(filePath);

    return filePath;
  }
}
