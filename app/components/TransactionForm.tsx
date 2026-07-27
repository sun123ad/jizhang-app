"use client";

import { useMemo, useState, type FormEvent } from "react";
import {
  CURRENCIES,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  type Currency,
  type TransactionType,
} from "@/lib/types";

export interface TransactionFormValues {
  occurredOn: string;
  type: TransactionType;
  currency: Currency;
  amount: string;
  category: string;
  note: string;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function defaultValues(): TransactionFormValues {
  return {
    occurredOn: today(),
    type: "expense",
    currency: "CNY",
    amount: "",
    category: EXPENSE_CATEGORIES[0],
    note: "",
  };
}

export function TransactionForm({
  initialValues,
  submitLabel,
  onSubmit,
}: {
  initialValues?: Partial<TransactionFormValues>;
  submitLabel: string;
  onSubmit: (values: TransactionFormValues) => Promise<void>;
}) {
  const [values, setValues] = useState<TransactionFormValues>({
    ...defaultValues(),
    ...initialValues,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categories = useMemo(
    () => (values.type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES),
    [values.type],
  );

  function handleTypeChange(next: TransactionType) {
    setValues((v) => ({
      ...v,
      type: next,
      category: next === "expense" ? EXPENSE_CATEGORIES[0] : INCOME_CATEGORIES[0],
    }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit(values);
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存失败，请重试");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-5"
    >
      <div className="flex rounded-lg bg-gray-100 p-1 text-sm">
        <button
          type="button"
          onClick={() => handleTypeChange("expense")}
          className={`flex-1 rounded-md py-2 ${
            values.type === "expense" ? "bg-white shadow font-medium" : "text-gray-500"
          }`}
        >
          支出
        </button>
        <button
          type="button"
          onClick={() => handleTypeChange("income")}
          className={`flex-1 rounded-md py-2 ${
            values.type === "income" ? "bg-white shadow font-medium" : "text-gray-500"
          }`}
        >
          收入
        </button>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        日期
        <input
          type="date"
          required
          value={values.occurredOn}
          max={today()}
          onChange={(e) => setValues((v) => ({ ...v, occurredOn: e.target.value }))}
          className="rounded-lg border border-gray-300 px-3 py-2"
        />
      </label>

      <div className="flex gap-3">
        <label className="flex flex-1 flex-col gap-1 text-sm">
          币种
          <select
            value={values.currency}
            onChange={(e) =>
              setValues((v) => ({ ...v, currency: e.target.value as Currency }))
            }
            className="rounded-lg border border-gray-300 px-3 py-2"
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-1 flex-col gap-1 text-sm">
          金额
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            required
            value={values.amount}
            onChange={(e) => setValues((v) => ({ ...v, amount: e.target.value }))}
            className="rounded-lg border border-gray-300 px-3 py-2"
            placeholder="0.00"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        分类
        <select
          value={values.category}
          onChange={(e) => setValues((v) => ({ ...v, category: e.target.value }))}
          className="rounded-lg border border-gray-300 px-3 py-2"
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        备注
        <input
          type="text"
          value={values.note}
          onChange={(e) => setValues((v) => ({ ...v, note: e.target.value }))}
          className="rounded-lg border border-gray-300 px-3 py-2"
          placeholder="选填"
        />
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-lg bg-blue-600 py-2 font-medium text-white disabled:opacity-50"
      >
        {submitting ? "保存中..." : submitLabel}
      </button>
    </form>
  );
}
