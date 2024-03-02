import { Inject, Injectable } from "@nestjs/common";
import axios from "axios";
import { Cache } from "cache-manager";
import { CACHE_MANAGER } from "@nestjs/cache-manager";

const CACHE_TTL = 1000 * 60 * 60;

@Injectable()
export class ConvertService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async convert(from: string, to: string, amount: number) {
    from = from.toUpperCase();
    to = to.toUpperCase();

    if (from === "USDT") {
      from = "USD";
    }

    if (to === "USDT") {
      to = "USD";
    }

    const cache = await this.cacheManager.get<object>(from);
    if (cache) {
      return amount * cache[to];
    }
    const { data } = await axios.get(`${process.env.EXCHANGE_API_ENDPOINT}/latest?api_key=${process.env.EXCHANGE_API_KEY}&base=${from}`);

    await this.cacheManager.set(from, data.rates, CACHE_TTL);

    return data.rates[to] * amount;
  }
}
