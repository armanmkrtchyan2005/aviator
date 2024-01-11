import { Injectable } from "@nestjs/common";
import axios from "axios";
import * as cheerio from 'cheerio';

@Injectable()
export class ConvertService {
  async convert(from: string, to: string, amount: number) {
    const { data } = await axios.get<string>(`https://www.google.com/search?q=${amount}+${from}+to+${to}+&hl=en`)
    const $ = cheerio.load(data);

    let val = $(".iBp4i").text().split(" ")[0] || `${amount}`
    console.log(val);

    val = val.split(",").join("")

    return +val;
  }
}
