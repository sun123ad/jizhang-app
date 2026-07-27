"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { daysSinceLastExport, shouldRemindExport } from "@/lib/reminder";

export function BackupReminderBanner() {
  const [visible, setVisible] = useState(false);
  const [days, setDays] = useState<number | null>(null);

  const checkReminder = useCallback(() => {
    setVisible(shouldRemindExport());
    setDays(daysSinceLastExport());
  }, []);

  useEffect(() => {
    checkReminder();
  }, [checkReminder]);

  if (!visible) return null;

  return (
    <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
      <span>
        {days === null
          ? "还没有导出过备份，建议导出一份"
          : `距上次备份已 ${days} 天，建议导出一份`}
      </span>
      <div className="flex items-center gap-3">
        <Link href="/export" className="font-medium underline">
          去导出
        </Link>
        <button
          onClick={() => setVisible(false)}
          className="text-amber-600"
          aria-label="关闭提醒"
        >
          ×
        </button>
      </div>
    </div>
  );
}
