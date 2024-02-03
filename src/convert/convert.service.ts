import { Inject, Injectable } from "@nestjs/common";
import axios from "axios";
import * as cheerio from 'cheerio';
import { Cache } from "cache-manager";
import { CACHE_MANAGER } from "@nestjs/cache-manager";

@Injectable()
export class ConvertService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) { }

  async convert(from: string, to: string, amount: number) {
    const cache = await this.cacheManager.get<number>(`${from}-${to}`)
    if (cache) {
      return amount * cache
    }

    const { data } = await axios.get(`https://cdn.jsdelivr.net/gh/fawazahmed0/currency-api@1/latest/currencies/${from.toLowerCase()}.json`)

    const rate = data[from.toLowerCase()][to.toLowerCase()]

    await this.cacheManager.set(`${from}-${to}`, rate, 1000 * 60)

    return amount * rate
  }
}
