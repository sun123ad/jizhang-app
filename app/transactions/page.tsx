"use client";

import Link from "next/link";
import { useAuth } from "@/lib/AuthProvider";
import { useTransactions } from "@/lib/useTransactions";
import { useMembers } from "@/lib/useMembers";
import { BASE_CURRENCY } from "@/lib/types";

export default function TransactionsPage() {
  const { ledgerId } = useAuth();
  const { transactions, loading } = useTransactions(ledgerId);
  const members = useMembers(ledgerId);

  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-xl font-semibold">交易明细</h1>
      {loading && <p className="text-sm text-gray-400">加载中...</p>}
      {!loading && transactions.length === 0 && (
        <p className="text-sm text-gray-400">还没有记录，去记一笔吧</p>
      )}
      <ul className="flex flex-col gap-2">
        {transactions.map((t) => (
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
