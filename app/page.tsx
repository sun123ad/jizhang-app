"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/AuthProvider";
import { useTransactions } from "@/lib/useTransactions";
import { getExchangeRate } from "@/lib/exchangeRate";
import { monthRange } from "@/lib/monthRange";
import { BASE_CURRENCY, CURRENCIES, type Currency } from "@/lib/types";
import { BackupReminderBanner } from "@/app/components/BackupReminderBanner";
import { CategoryBreakdown } from "@/app/components/CategoryBreakdown";

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function HomePage() {
  const { ledgerId, loading: authLoading } = useAuth();
  const [monthOffset, setMonthOffset] = useState(0);
  const { from, to, label } = useMemo(() => monthRange(monthOffset), [monthOffset]);
  const { transactions, loading } = useTransactions(ledgerId, { from, to });

  const [displayCurrency, setDisplayCurrency] = useState<Currency>(BASE_CURRENCY);
  const [rate, setRate] = useState(1);
  const [rateError, setRateError] = useState(false);

  useEffect(() => {
    if (displayCurrency === BASE_CURRENCY) {
      setRate(1);
      setRateError(false);
      return;
    }
    let cancelled = false;
    getExchangeRate(displayCurrency, today())
      .then((r) => {
        if (!cancelled) {
          setRate(r);
          setRateError(false);
        }
      })
      .catch(() => {
        if (!cancelled) setRateError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [displayCurrency]);

  const { income, expense, categoryList } = useMemo(() => {
    let income = 0;
    let expense = 0;
    const byCategory = new Map<string, number>();
    for (const t of transactions) {
      if (t.type === "income") {
        income += t.base_amount;
      } else {
        expense += t.base_amount;
        byCategory.set(
          t.category,
          (byCategory.get(t.category) ?? 0) + t.base_amount,
        );
      }
    }
    const categoryList = Array.from(byCategory.entries()).sort(
      (a, b) => b[1] - a[1],
    );
    return { income, expense, categoryList };
  }, [transactions]);

  if (authLoading || !ledgerId) {
    return (
      <p className="py-10 text-center text-gray-500">
        {authLoading ? "加载中..." : "尚未关联账本，请联系管理员在 Supabase 后台把你加入 ledger_members"}
      </p>
    );
  }

  const convert = (amountInBase: number) =>
    displayCurrency === BASE_CURRENCY ? amountInBase : amountInBase / rate;

  return (
    <div className="flex flex-col gap-4">
      <BackupReminderBanner />

      <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-2 py-2">
        <button
          type="button"
          onClick={() => setMonthOffset((o) => o - 1)}
          className="rounded-lg px-3 py-1 text-lg text-gray-500"
        >
          ‹
        </button>
        <p className="font-medium">{label}</p>
        <button
          type="button"
          onClick={() => setMonthOffset((o) => o + 1)}
          disabled={monthOffset >= 0}
          className="rounded-lg px-3 py-1 text-lg text-gray-500 disabled:opacity-30"
        >
          ›
        </button>
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">结余（{displayCurrency}）</p>
          {loading && <span className="text-xs text-gray-400">同步中...</span>}
        </div>
        <p className="mt-1 text-3xl font-semibold">
          {convert(income - expense).toFixed(2)}
        </p>
        <div className="mt-4 flex gap-6 text-sm">
          <div>
            <p className="text-gray-500">收入</p>
            <p className="font-medium text-green-600">
              {convert(income).toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-gray-500">支出</p>
            <p className="font-medium text-red-600">
              {convert(expense).toFixed(2)}
            </p>
          </div>
        </div>

        <div className="mt-4 flex rounded-lg bg-gray-100 p-1 text-xs">
          {CURRENCIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setDisplayCurrency(c)}
              className={`flex-1 rounded-md py-1.5 ${
                displayCurrency === c ? "bg-white shadow font-medium" : "text-gray-500"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        {rateError && (
          <p className="mt-2 text-xs text-red-600">
            汇率获取失败，以上金额可能不准确
          </p>
        )}
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <CategoryBreakdown
          categoryList={categoryList.map(
            ([cat, amt]) => [cat, convert(amt)] as [string, number],
          )}
          currency={displayCurrency}
        />
      </section>

      <Link
        href="/transactions/new"
        className="rounded-xl bg-blue-600 py-3 text-center font-medium text-white"
      >
        + 记一笔
      </Link>
    </div>
  );
}
