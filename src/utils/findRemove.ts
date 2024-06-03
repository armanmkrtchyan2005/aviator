import * as fs from "fs";
import * as path from "path";
import { rimraf } from "rimraf";

export function findRemove(filePath: string, deleteMs: number) {
  const files = fs.readdirSync(filePath);
  files.forEach(function (file, index) {
    const deletedFilePath = path.resolve(filePath, file)
    const stat = fs.statSync(deletedFilePath);

    let endTime: number;
    let now: number;

    now = new Date().getTime();
    endTime = new Date(stat.ctime).getTime() + deleteMs;
    if (now > endTime) {
      return rimraf(deletedFilePath);
    }
    
  });
}
