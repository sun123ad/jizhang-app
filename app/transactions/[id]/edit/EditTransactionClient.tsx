"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthProvider";
import { supabase } from "@/lib/supabase";
import { getExchangeRate } from "@/lib/exchangeRate";
import {
  TransactionForm,
  type TransactionFormValues,
} from "@/app/components/TransactionForm";
import type { Transaction } from "@/lib/types";

export function EditTransactionClient({ id }: { id: string }) {
  const { ledgerId } = useAuth();
  const router = useRouter();

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ledgerId) return;
    supabase
      .from("transactions")
      .select("*")
      .eq("id", id)
      .maybeSingle()
      .then(({ data }) => {
        setTransaction((data as Transaction) ?? null);
        setLoading(false);
      });
  }, [id, ledgerId]);

  async function handleSubmit(values: TransactionFormValues) {
    const amountNum = Number(values.amount);
    if (!amountNum || amountNum <= 0) {
      throw new Error("请输入有效金额");
    }

    const rate = await getExchangeRate(values.currency, values.occurredOn);
    const baseAmount = Math.round(amountNum * rate * 100) / 100;

    const { error } = await supabase
      .from("transactions")
      .update({
        occurred_on: values.occurredOn,
        type: values.type,
        currency: values.currency,
        amount: amountNum,
        exchange_rate: rate,
        base_amount: baseAmount,
        category: values.category,
        note: values.note || null,
      })
      .eq("id", id);

    if (error) throw error;
    router.push("/transactions");
  }

  if (loading) {
    return <p className="py-10 text-center text-gray-500">加载中...</p>;
  }

  if (!transaction) {
    return <p className="py-10 text-center text-gray-500">没有找到这条记录</p>;
  }

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">编辑记录</h1>
      <TransactionForm
        submitLabel="保存修改"
        initialValues={{
          occurredOn: transaction.occurred_on,
          type: transaction.type,
          currency: transaction.currency,
          amount: String(transaction.amount),
          category: transaction.category,
          note: transaction.note ?? "",
        }}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
