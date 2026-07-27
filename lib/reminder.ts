const STORAGE_KEY = "jizhang:lastExportAt";
export const REMINDER_INTERVAL_DAYS = 30;

export function getLastExportAt(): Date | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? new Date(raw) : null;
}

export function markExported() {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, new Date().toISOString());
}

export function daysSinceLastExport(): number | null {
  const last = getLastExportAt();
  if (!last) return null;
  const diffMs = Date.now() - last.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

export function shouldRemindExport(): boolean {
  const days = daysSinceLastExport();
  return days === null || days >= REMINDER_INTERVAL_DAYS;
}
