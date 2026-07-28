import { supabase } from "./supabase";
import { BASE_CURRENCY, type Currency } from "./types";

/**
 * 返回 1 单位 `currency` 兑换成 BASE_CURRENCY 的汇率。
 * 先查 exchange_rates 缓存表，没有则调 Frankfurter API 并写入缓存；
 * 请求失败时退回该币种最近一次缓存的汇率。
 */
export async function getExchangeRate(
  currency: Currency,
  date: string,
): Promise<number> {
  if (currency === BASE_CURRENCY) return 1;

  const { data: cached } = await supabase
    .from("exchange_rates")
    .select("rate")
    .eq("base_currency", BASE_CURRENCY)
    .eq("target_currency", currency)
    .eq("rate_date", date)
    .maybeSingle();

  if (cached) return Number(cached.rate);

  try {
    const res = await fetch(
      `https://api.frankfurter.dev/v1/${date}?from=${currency}&to=${BASE_CURRENCY}`,
    );
    if (!res.ok) throw new Error("汇率请求失败");
    const json = await res.json();
    const rate = json.rates?.[BASE_CURRENCY];
    if (!rate) throw new Error("汇率数据缺失");

    await supabase.from("exchange_rates").insert({
      base_currency: BASE_CURRENCY,
      target_currency: currency,
      rate,
      rate_date: date,
    });

    return Number(rate);
  } catch (err) {
    const { data: fallback } = await supabase
      .from("exchange_rates")
      .select("rate")
      .eq("base_currency", BASE_CURRENCY)
      .eq("target_currency", currency)
      .order("rate_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fallback) return Number(fallback.rate);
    throw err;
  }
}
