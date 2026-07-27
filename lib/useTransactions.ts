"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabase";
import type { Transaction } from "./types";

export function useTransactions(
  ledgerId: string | null,
  options?: { from?: string; to?: string },
) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const from = options?.from;
  const to = options?.to;

  const fetchTransactions = useCallback(async () => {
    if (!ledgerId) return;
    setLoading(true);
    let query = supabase
      .from("transactions")
      .select("*")
      .eq("ledger_id", ledgerId)
      .order("occurred_on", { ascending: false })
      .order("created_at", { ascending: false });

    if (from) query = query.gte("occurred_on", from);
    if (to) query = query.lte("occurred_on", to);

    const { data } = await query;
    setTransactions((data as Transaction[]) ?? []);
    setLoading(false);
  }, [ledgerId, from, to]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  useEffect(() => {
    if (!ledgerId) return;
    const channel = supabase
      .channel(`transactions-${ledgerId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "transactions",
          filter: `ledger_id=eq.${ledgerId}`,
        },
        () => {
          fetchTransactions();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ledgerId, fetchTransactions]);

  return { transactions, loading, refresh: fetchTransactions };
}
