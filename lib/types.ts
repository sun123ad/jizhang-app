export type Currency = "CNY" | "SGD" | "GBP";

export const CURRENCIES: Currency[] = ["CNY", "SGD", "GBP"];

export const BASE_CURRENCY: Currency = "CNY";

export type TransactionType = "income" | "expense";

export const EXPENSE_CATEGORIES = [
  "餐饮",
  "交通",
  "房租",
  "购物",
  "娱乐",
  "其他",
] as const;

export const INCOME_CATEGORIES = ["工资", "其他"] as const;

export interface Transaction {
  id: string;
  ledger_id: string;
  user_id: string;
  occurred_on: string;
  type: TransactionType;
  currency: Currency;
  amount: number;
  exchange_rate: number;
  base_amount: number;
  category: string;
  note: string | null;
  created_at: string;
}

export interface LedgerMember {
  ledger_id: string;
  user_id: string;
  display_name: string | null;
}
