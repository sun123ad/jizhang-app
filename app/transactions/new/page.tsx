"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthProvider";
import { supabase } from "@/lib/supabase";
import { getExchangeRate } from "@/lib/exchangeRate";
import {
  TransactionForm,
  type TransactionFormValues,
} from "@/app/components/TransactionForm";

export default function NewTransactionPage() {
  const { ledgerId, user } = useAuth();
  const router = useRouter();

  async function handleSubmit(values: TransactionFormValues) {
    if (!ledgerId || !user) {
      throw new Error("账本信息尚未加载完成，请稍后重试");
    }
    const amountNum = Number(values.amount);
    if (!amountNum || amountNum <= 0) {
      throw new Error("请输入有效金额");
    }

    const rate = await getExchangeRate(values.currency, values.occurredOn);
    const baseAmount = Math.round(amountNum * rate * 100) / 100;

    const { error } = await supabase.from("transactions").insert({
      ledger_id: ledgerId,
      user_id: user.id,
      occurred_on: values.occurredOn,
      type: values.type,
      currency: values.currency,
      amount: amountNum,
      exchange_rate: rate,
      base_amount: baseAmount,
      category: values.category,
      note: values.note || null,
    });

    if (error) throw error;
    router.push("/");
  }

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">记一笔</h1>
      <TransactionForm submitLabel="保存" onSubmit={handleSubmit} />
    </div>
  );
}
