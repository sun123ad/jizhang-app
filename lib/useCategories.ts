"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "./supabase";
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  type TransactionType,
} from "./types";

function fixedCategories(type: TransactionType): readonly string[] {
  return type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
}

export function useCategories(ledgerId: string | null, type: TransactionType) {
  const [custom, setCustom] = useState<string[]>([]);

  const fetchCustom = useCallback(async () => {
    if (!ledgerId) return;
    const { data } = await supabase
      .from("custom_categories")
      .select("name")
      .eq("ledger_id", ledgerId)
      .eq("type", type)
      .order("created_at", { ascending: true });
    setCustom((data ?? []).map((row) => row.name as string));
  }, [ledgerId, type]);

  useEffect(() => {
    fetchCustom();
  }, [fetchCustom]);

  // Keep "其他" as the last, catch-all option.
  const categories = useMemo(() => {
    const fixed = fixedCategories(type);
    return [...fixed.slice(0, -1), ...custom, fixed[fixed.length - 1]];
  }, [type, custom]);

  const addCategory = useCallback(
    async (name: string) => {
      if (!ledgerId) throw new Error("账本信息尚未加载完成");
      const trimmed = name.trim();
      if (!trimmed) throw new Error("请输入分类名称");
      if (categories.includes(trimmed)) return trimmed;

      const { error } = await supabase.from("custom_categories").insert({
        ledger_id: ledgerId,
        type,
        name: trimmed,
      });
      if (error) throw error;
      await fetchCustom();
      return trimmed;
    },
    [ledgerId, type, categories, fetchCustom],
  );

  return { categories, addCategory };
}
