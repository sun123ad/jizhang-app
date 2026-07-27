"use client";

import { useEffect, useState } from "react";
import { supabase } from "./supabase";

export function useMembers(ledgerId: string | null) {
  const [members, setMembers] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!ledgerId) return;
    supabase
      .from("ledger_members")
      .select("user_id, display_name")
      .eq("ledger_id", ledgerId)
      .then(({ data }) => {
        const map: Record<string, string> = {};
        for (const m of data ?? []) {
          map[m.user_id] = m.display_name ?? m.user_id.slice(0, 6);
        }
        setMembers(map);
      });
  }, [ledgerId]);

  return members;
}
