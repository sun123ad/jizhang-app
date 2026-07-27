"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/AuthProvider";
import { useTransactions } from "@/lib/useTransactions";
import { BASE_CURRENCY } from "@/lib/types";
import { BackupReminderBanner } from "@/app/components/BackupReminderBanner";

function monthRange() {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  return {
    from: first.toISOString().slice(0, 10),
    to: now.toISOString().slice(0, 10),
  };
}

export default function HomePage() {
  const { ledgerId, loading: authLoading } = useAuth();
  const { from, to } = useMemo(() => monthRange(), []);
  const { transactions, loading } = useTransactions(ledgerId, { from, to });

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

  const maxCategory = categoryList[0]?.[1] ?? 0;

  return (
    <div className="flex flex-col gap-4">
      <BackupReminderBanner />

      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">本月结余（{BASE_CURRENCY}）</p>
          {loading && <span className="text-xs text-gray-400">同步中...</span>}
        </div>
        <p className="mt-1 text-3xl font-semibold">
          {(income - expense).toFixed(2)}
        </p>
        <div className="mt-4 flex gap-6 text-sm">
          <div>
            <p className="text-gray-500">收入</p>
            <p className="font-medium text-green-600">{income.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-gray-500">支出</p>
            <p className="font-medium text-red-600">{expense.toFixed(2)}</p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <p className="mb-3 text-sm text-gray-500">支出分类占比</p>
        {categoryList.length === 0 && (
          <p className="text-sm text-gray-400">本月还没有支出记录</p>
        )}
        <div className="flex flex-col gap-2">
          {categoryList.map(([cat, amt]) => (
            <div key={cat}>
              <div className="mb-1 flex justify-between text-sm">
                <span>{cat}</span>
                <span>{amt.toFixed(2)}</span>
              </div>
              <div className="h-2 rounded-full bg-gray-100">
                <div
                  className="h-2 rounded-full bg-blue-500"
                  style={{
                    width: `${maxCategory ? (amt / maxCategory) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
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
