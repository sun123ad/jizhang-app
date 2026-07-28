export function monthRange(offset: number) {
  const now = new Date();
  const target = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const first = new Date(target.getFullYear(), target.getMonth(), 1);
  const last = new Date(target.getFullYear(), target.getMonth() + 1, 0);
  return {
    from: first.toISOString().slice(0, 10),
    to: last.toISOString().slice(0, 10),
    label: `${target.getFullYear()}年${target.getMonth() + 1}月`,
  };
}
