import { BadRequestException, Injectable, PipeTransform } from "@nestjs/common";
import * as path from "path";
import * as sharp from "sharp";

@Injectable()
export class SharpPipe implements PipeTransform<Express.Multer.File, Promise<string>> {
  async transform(image: Express.Multer.File): Promise<string> {
    const filename = Date.now() + ".webp";

    const filePath = path.join("uploads", "profile-images", filename);
    await sharp(image.buffer).resize({ width: 800, height: 800 }).webp({ effort: 3 }).toFile(filePath);

    return filePath;
  }
}
