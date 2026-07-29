export function monthRange(offset: number) {
  const now = new Date();
  const target = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const first = new Date(target.getFullYear(), target.getMonth(), 1);
  const last = new Date(target.getFullYear(), target.getMonth() + 1, 0);
  return {
    from: first.toISOString().slice(0, 10),
    to: last.toISOString().slice(0, 10),
    label: `${target.getFullYear()}年${target.getMonth() + 1}月`,
    yearMonth: `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, "0")}`,
  };
}

// Inverse of the `yearMonth` above: turns "2026-07" back into an offset
// relative to the current month, for deep-linking into a specific month.
export function offsetFromYearMonth(yearMonth: string): number {
  const [y, m] = yearMonth.split("-").map(Number);
  const now = new Date();
  if (!y || !m) return 0;
  return (y - now.getFullYear()) * 12 + (m - 1 - now.getMonth());
}
