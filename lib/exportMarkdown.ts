import { BASE_CURRENCY, type Transaction } from "./types";

export function buildMarkdown(
  transactions: Transaction[],
  members: Record<string, string>,
  rangeLabel: string,
): string {
  const sorted = [...transactions].sort((a, b) =>
    a.occurred_on < b.occurred_on ? -1 : a.occurred_on > b.occurred_on ? 1 : 0,
  );

  let income = 0;
  let expense = 0;
  for (const t of sorted) {
    if (t.type === "income") income += t.base_amount;
    else expense += t.base_amount;
  }

  const lines: string[] = [];
  lines.push(`# 账本备份 - ${rangeLabel}`);
  lines.push("");
  lines.push(`本位币：${BASE_CURRENCY}`);
  lines.push(`收入合计：${income.toFixed(2)} ${BASE_CURRENCY}`);
  lines.push(`支出合计：${expense.toFixed(2)} ${BASE_CURRENCY}`);
  lines.push(`结余：${(income - expense).toFixed(2)} ${BASE_CURRENCY}`);
  lines.push("");
  lines.push(
    `| 日期 | 记录人 | 类型 | 原币金额 | 换算(${BASE_CURRENCY}) | 分类 | 备注 |`,
  );
  lines.push("|------|--------|------|---------|------------|------|------|");

  for (const t of sorted) {
    const who = members[t.user_id] ?? t.user_id.slice(0, 6);
    const typeLabel = t.type === "income" ? "收入" : "支出";
    const note = (t.note ?? "").replace(/\|/g, "\\|");
    lines.push(
      `| ${t.occurred_on} | ${who} | ${typeLabel} | ${t.currency} ${t.amount.toFixed(2)} | ${t.base_amount.toFixed(2)} | ${t.category} | ${note} |`,
    );
  }

  return lines.join("\n") + "\n";
}
