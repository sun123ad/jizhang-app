"use client";

import { useState, type FormEvent } from "react";
import { useAuth } from "@/lib/AuthProvider";
import { useCategories } from "@/lib/useCategories";
import {
  CURRENCIES,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  type Currency,
  type TransactionType,
} from "@/lib/types";

const NEW_CATEGORY_OPTION = "__new__";

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

  const { ledgerId } = useAuth();
  const { categories: knownCategories, addCategory } = useCategories(
    ledgerId,
    values.type,
  );
  // Guarantee the current value always has a matching <option>, even if it's
  // an orphaned category (e.g. imported via Markdown) not in the known list.
  const categories = knownCategories.includes(values.category)
    ? knownCategories
    : [values.category, ...knownCategories];

  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [categoryError, setCategoryError] = useState<string | null>(null);

  function handleTypeChange(next: TransactionType) {
    setValues((v) => ({
      ...v,
      type: next,
      category: next === "expense" ? EXPENSE_CATEGORIES[0] : INCOME_CATEGORIES[0],
    }));
    setAddingCategory(false);
    setCategoryError(null);
  }

  function handleCategorySelect(value: string) {
    if (value === NEW_CATEGORY_OPTION) {
      setAddingCategory(true);
      setCategoryError(null);
      return;
    }
    setValues((v) => ({ ...v, category: value }));
  }

  async function handleConfirmAddCategory() {
    setCategoryError(null);
    try {
      const name = await addCategory(newCategoryName);
      setValues((v) => ({ ...v, category: name }));
      setAddingCategory(false);
      setNewCategoryName("");
    } catch (err) {
      setCategoryError(err instanceof Error ? err.message : "添加失败，请重试");
    }
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

      <div className="flex flex-col gap-1 text-sm">
        分类
        {addingCategory ? (
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <input
                type="text"
                autoFocus
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="新分类名称，比如理财"
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2"
              />
              <button
                type="button"
                onClick={handleConfirmAddCategory}
                className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white"
              >
                添加
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                setAddingCategory(false);
                setNewCategoryName("");
                setCategoryError(null);
              }}
              className="self-start text-xs text-gray-500 underline"
            >
              取消，改选已有分类
            </button>
            {categoryError && (
              <p className="text-xs text-red-600">{categoryError}</p>
            )}
          </div>
        ) : (
          <select
            value={values.category}
            onChange={(e) => handleCategorySelect(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
            <option value={NEW_CATEGORY_OPTION}>+ 新建分类...</option>
          </select>
        )}
      </div>

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
