import {
  CURRENCIES,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  type Currency,
  type TransactionType,
} from "./types";

export interface ParsedRow {
  line: number;
  raw: Record<string, string>;
  date?: string;
  type?: TransactionType;
  currency?: Currency;
  amount?: number;
  category?: string;
  note?: string;
  errors: string[];
  warnings: string[];
}

export interface ParseResult {
  rows: ParsedRow[];
  formatError?: string;
}

const COLUMN_ALIASES: Record<string, string[]> = {
  date: ["日期"],
  type: ["类型"],
  currency: ["币种", "货币"],
  amount: ["金额"],
  category: ["分类", "类别"],
  note: ["备注"],
};

function splitRow(line: string): string[] {
  const trimmed = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  return trimmed.split("|").map((cell) => cell.trim());
}

function isSeparatorRow(cells: string[]): boolean {
  return cells.every((cell) => /^:?-+:?$/.test(cell));
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function parseDate(raw: string): { value?: string; error?: string } {
  const value = raw.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return { error: `日期"${raw}"格式不对，需要 YYYY-MM-DD` };
  }
  const d = new Date(value + "T00:00:00");
  const [y, m, day] = value.split("-").map(Number);
  if (d.getFullYear() !== y || d.getMonth() + 1 !== m || d.getDate() !== day) {
    return { error: `日期"${raw}"不是一个真实存在的日期` };
  }
  if (value > today()) {
    return { error: `日期"${raw}"是未来的日期` };
  }
  return { value };
}

function parseType(raw: string): { value?: TransactionType; error?: string } {
  const value = raw.trim().toLowerCase();
  if (value === "支出" || value === "expense") return { value: "expense" };
  if (value === "收入" || value === "income") return { value: "income" };
  return { error: `类型"${raw}"无法识别，只能是"支出"或"收入"` };
}

function parseCurrency(raw: string): { value?: Currency; error?: string } {
  const value = raw.trim().toUpperCase();
  if ((CURRENCIES as string[]).includes(value)) return { value: value as Currency };
  return { error: `币种"${raw}"不支持，只能是 ${CURRENCIES.join("/")}` };
}

function parseAmount(raw: string): { value?: number; error?: string } {
  const value = Number(raw.trim().replace(/,/g, ""));
  if (!Number.isFinite(value) || value <= 0) {
    return { error: `金额"${raw}"不是有效的正数` };
  }
  return { value: Math.round(value * 100) / 100 };
}

export interface KnownCategories {
  expense: readonly string[];
  income: readonly string[];
}

function normalizeCategory(
  type: TransactionType,
  raw: string,
  known?: KnownCategories,
): { value: string; warning?: string } {
  const value = raw.trim();
  const fixed: readonly string[] = type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  const extra = (type === "expense" ? known?.expense : known?.income) ?? [];
  const list = [...fixed, ...extra];
  if (list.includes(value)) return { value };
  return {
    value: "其他",
    warning: `分类"${raw}"不在已有分类列表里，已归为"其他"（可以先在"记一笔"里把它加成自定义分类，再重新导入）`,
  };
}

export function parseMarkdownTable(
  content: string,
  knownCategories?: KnownCategories,
): ParseResult {
  const lines = content.split(/\r?\n/);
  const tableLineIndexes: number[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith("|")) tableLineIndexes.push(i);
  }
  if (tableLineIndexes.length < 2) {
    return { rows: [], formatError: "没有找到 Markdown 表格，请确认文件里包含 | 分隔的表格" };
  }

  const headerIdx = tableLineIndexes[0];
  const headerCells = splitRow(lines[headerIdx]);
  const columnIndex: Partial<Record<keyof typeof COLUMN_ALIASES, number>> = {};
  for (const [key, aliases] of Object.entries(COLUMN_ALIASES)) {
    const idx = headerCells.findIndex((cell) => aliases.includes(cell));
    if (idx !== -1) columnIndex[key as keyof typeof COLUMN_ALIASES] = idx;
  }
  const required = ["date", "type", "currency", "amount", "category"] as const;
  const missing = required.filter((key) => columnIndex[key] === undefined);
  if (missing.length > 0) {
    return {
      rows: [],
      formatError: `表格缺少必须的列：${missing
        .map((k) => COLUMN_ALIASES[k][0])
        .join("、")}`,
    };
  }

  const dataLineIndexes = tableLineIndexes.slice(1).filter((idx) => {
    const cells = splitRow(lines[idx]);
    return !isSeparatorRow(cells);
  });

  const rows: ParsedRow[] = dataLineIndexes.map((idx) => {
    const cells = splitRow(lines[idx]);
    const get = (key: keyof typeof COLUMN_ALIASES) =>
      columnIndex[key] !== undefined ? (cells[columnIndex[key]!] ?? "") : "";

    const raw: Record<string, string> = {
      date: get("date"),
      type: get("type"),
      currency: get("currency"),
      amount: get("amount"),
      category: get("category"),
      note: get("note"),
    };

    const errors: string[] = [];
    const warnings: string[] = [];

    const date = parseDate(raw.date);
    if (date.error) errors.push(date.error);

    const type = parseType(raw.type);
    if (type.error) errors.push(type.error);

    const currency = parseCurrency(raw.currency);
    if (currency.error) errors.push(currency.error);

    const amount = parseAmount(raw.amount);
    if (amount.error) errors.push(amount.error);

    let category: string | undefined;
    if (type.value) {
      const normalized = normalizeCategory(type.value, raw.category, knownCategories);
      category = normalized.value;
      if (normalized.warning) warnings.push(normalized.warning);
    }

    return {
      line: idx + 1,
      raw,
      date: date.value,
      type: type.value,
      currency: currency.value,
      amount: amount.value,
      category,
      note: raw.note || undefined,
      errors,
      warnings,
    };
  });

  return { rows };
}
