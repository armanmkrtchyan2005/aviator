import { Injectable, PipeTransform } from "@nestjs/common";
import * as path from "path";
import * as fs from "fs";
import * as sharp from "sharp";

@Injectable()
export class ReplenishmentFilePipe implements PipeTransform<Express.Multer.File, Promise<string>> {
  async transform(file?: Express.Multer.File): Promise<string> {
    if (!file) {
      return "";
    }
    const filename = Date.now();

    const folder = path.join("uploads", "files");
    let filePath = path.join(folder, filename + ".pdf");

    fs.mkdirSync(folder, { recursive: true });

    if (file.mimetype.includes("image")) {
      filePath = path.join(folder, filename + ".webp");
      await sharp(file.buffer).webp({ effort: 3, quality: 100 }).toFile(filePath);
      return filePath;
    }

    filePath = path.join(folder, filename + ".pdf");

    fs.writeFileSync(filePath, file.buffer);

    return filePath;
  }
}
