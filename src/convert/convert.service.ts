import { Injectable } from "@nestjs/common";
import axios from "axios";
import * as cheerio from 'cheerio';

@Injectable()
export class ConvertService {
  async convert(from: string, to: string, amount: number) {
    const { data } = await axios.get<string>(`https://www.google.com/search?q=${amount}+${from}+to+${to}+&hl=en`)
    const $ = cheerio.load(data);

    let val = $(".iBp4i").text().split(" ")[0] || `${amount}`

    const separators = val.replace(/\p{Number}/gu, '').split("")

    let thousandSeparator = separators.length === 1 ? "1" : separators[0]
    let decimalSeparator = separators[separators.length - 1]

    return parseFloat(val
      .replace(new RegExp('\\' + thousandSeparator, 'g'), '')
      .replace(new RegExp('\\' + decimalSeparator), '.')
    );
  }
}
