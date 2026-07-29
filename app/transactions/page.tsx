"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/AuthProvider";
import { useTransactions } from "@/lib/useTransactions";
import { useMembers } from "@/lib/useMembers";
import { monthRange, offsetFromYearMonth } from "@/lib/monthRange";
import { BASE_CURRENCY } from "@/lib/types";

const ALL = "__all__";

export default function TransactionsPage() {
  const { ledgerId } = useAuth();
  const searchParams = useSearchParams();
  const [showAllTime, setShowAllTime] = useState(false);
  const [monthOffset, setMonthOffset] = useState(() => {
    const month = searchParams.get("month");
    return month ? offsetFromYearMonth(month) : 0;
  });
  const [categoryFilter, setCategoryFilter] = useState(
    () => searchParams.get("category") ?? ALL,
  );
  const [memberFilter, setMemberFilter] = useState(ALL);

  const { from, to, label } = useMemo(() => monthRange(monthOffset), [monthOffset]);
  const { transactions, loading } = useTransactions(
    ledgerId,
    showAllTime ? undefined : { from, to },
  );
  const members = useMembers(ledgerId);

  const categories = useMemo(() => {
    const set = new Set(transactions.map((t) => t.category));
    return Array.from(set).sort((a, b) => a.localeCompare(b, "zh"));
  }, [transactions]);

  const filtered = transactions.filter((t) => {
    if (categoryFilter !== ALL && t.category !== categoryFilter) return false;
    if (memberFilter !== ALL && t.user_id !== memberFilter) return false;
    return true;
  });

  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-xl font-semibold">交易明细</h1>

      <div className="flex rounded-lg bg-gray-100 p-1 text-sm">
        <button
          type="button"
          onClick={() => setShowAllTime(false)}
          className={`flex-1 rounded-md py-2 ${
            !showAllTime ? "bg-white shadow font-medium" : "text-gray-500"
          }`}
        >
          按月查看
        </button>
        <button
          type="button"
          onClick={() => setShowAllTime(true)}
          className={`flex-1 rounded-md py-2 ${
            showAllTime ? "bg-white shadow font-medium" : "text-gray-500"
          }`}
        >
          全部
        </button>
      </div>

      {!showAllTime && (
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
      )}

      <div className="flex gap-3">
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value={ALL}>全部分类</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={memberFilter}
          onChange={(e) => setMemberFilter(e.target.value)}
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value={ALL}>全部成员</option>
          {Object.entries(members).map(([userId, name]) => (
            <option key={userId} value={userId}>
              {name}
            </option>
          ))}
        </select>
      </div>

      {loading && <p className="text-sm text-gray-400">加载中...</p>}
      {!loading && transactions.length === 0 && (
        <p className="text-sm text-gray-400">还没有记录，去记一笔吧</p>
      )}
      {!loading && transactions.length > 0 && filtered.length === 0 && (
        <p className="text-sm text-gray-400">没有符合筛选条件的记录</p>
      )}
      <ul className="flex flex-col gap-2">
        {filtered.map((t) => (
          <li key={t.id}>
            <Link
              href={`/transactions/${t.id}/edit`}
              className="block rounded-xl border border-gray-200 bg-white p-4 active:bg-gray-50"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{t.category}</span>
                <span
                  className={
                    t.type === "income" ? "text-green-600" : "text-red-600"
                  }
                >
                  {t.type === "income" ? "+" : "-"}
                  {t.currency} {t.amount.toFixed(2)}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
                <span>
                  {t.occurred_on} · {members[t.user_id] ?? "成员"}
                </span>
                <span>
                  ≈ {BASE_CURRENCY} {t.base_amount.toFixed(2)}
                </span>
              </div>
              {t.note && <p className="mt-1 text-xs text-gray-500">{t.note}</p>}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
