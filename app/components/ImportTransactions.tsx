"use client";

import { useState, type ChangeEvent } from "react";
import { useAuth } from "@/lib/AuthProvider";
import { useCategories } from "@/lib/useCategories";
import { supabase } from "@/lib/supabase";
import { getExchangeRate } from "@/lib/exchangeRate";
import { parseMarkdownTable, type ParseResult } from "@/lib/importMarkdown";

function buildPromptTemplate(
  expenseCategories: string[],
  incomeCategories: string[],
) {
  return `请把我下面描述的收支记录整理成一个 Markdown 表格，表头和格式严格如下（不要增删列，日期必须是 YYYY-MM-DD）：

| 日期 | 类型 | 币种 | 金额 | 分类 | 备注 |
|------|------|------|------|------|------|
| 2026-07-10 | 支出 | CNY | 35 | 交通 | 打车 |

- 类型只能填"支出"或"收入"
- 币种只能填 CNY、SGD 或 GBP
- 支出分类只能是：${expenseCategories.join("、")}
- 收入分类只能是：${incomeCategories.join("、")}
- 备注可以留空，但列要保留

我的记录：
（把你的自然语言描述粘贴在这里）`;
}

export function ImportTransactions() {
  const { ledgerId, user } = useAuth();
  const { categories: expenseCategories } = useCategories(ledgerId, "expense");
  const { categories: incomeCategories } = useCategories(ledgerId, "income");
  const [showFormat, setShowFormat] = useState(false);
  const [copied, setCopied] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [imported, setImported] = useState<number | null>(null);

  const promptTemplate = buildPromptTemplate(expenseCategories, incomeCategories);

  function handleCopyPrompt() {
    navigator.clipboard.writeText(promptTemplate).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setFileName(file.name);
    setImported(null);
    setImportError(null);
    const reader = new FileReader();
    reader.onload = () => {
      setParseResult(
        parseMarkdownTable(String(reader.result ?? ""), {
          expense: expenseCategories,
          income: incomeCategories,
        }),
      );
    };
    reader.readAsText(file);
  }

  async function handleConfirmImport() {
    if (!parseResult || !ledgerId || !user) return;
    const validRows = parseResult.rows.filter((r) => r.errors.length === 0);
    if (validRows.length === 0) return;

    setImporting(true);
    setImportError(null);
    try {
      const records = [];
      for (const row of validRows) {
        const rate = await getExchangeRate(row.currency!, row.date!);
        const baseAmount = Math.round(row.amount! * rate * 100) / 100;
        records.push({
          ledger_id: ledgerId,
          user_id: user.id,
          occurred_on: row.date!,
          type: row.type!,
          currency: row.currency!,
          amount: row.amount!,
          exchange_rate: rate,
          base_amount: baseAmount,
          category: row.category!,
          note: row.note || null,
        });
      }

      const { error } = await supabase.from("transactions").insert(records);
      if (error) throw error;

      setImported(records.length);
      setParseResult(null);
      setFileName(null);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "导入失败，请重试");
    } finally {
      setImporting(false);
    }
  }

  const validRows = parseResult?.rows.filter((r) => r.errors.length === 0) ?? [];
  const invalidRows = parseResult?.rows.filter((r) => r.errors.length > 0) ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-gray-200 bg-white p-5 text-sm text-gray-600">
        <p>
          上传一个 Markdown 表格文件，批量导入交易记录。这个文件可以让任意 LLM
          读你的自然语言描述来生成——
          <button
            type="button"
            onClick={() => setShowFormat((v) => !v)}
            className="font-medium text-blue-600 underline"
          >
            {showFormat ? "收起格式说明" : "查看格式说明 / 复制给 AI 的提示词"}
          </button>
        </p>

        {showFormat && (
          <div className="mt-3 flex flex-col gap-2">
            <pre className="whitespace-pre-wrap rounded-lg bg-gray-50 p-3 text-xs text-gray-700">
              {promptTemplate}
            </pre>
            <button
              type="button"
              onClick={handleCopyPrompt}
              className="self-start rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700"
            >
              {copied ? "已复制" : "复制提示词"}
            </button>
          </div>
        )}
      </div>

      <label className="flex flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-500">
        <span className="font-medium text-blue-600">选择 Markdown 文件</span>
        <span className="text-xs text-gray-400">
          {fileName ?? "支持 .md 文件"}
        </span>
        <input
          type="file"
          accept=".md,text/markdown"
          onChange={handleFileChange}
          className="hidden"
        />
      </label>

      {parseResult?.formatError && (
        <p className="text-sm text-red-600">{parseResult.formatError}</p>
      )}

      {parseResult && !parseResult.formatError && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-gray-600">
            识别到 {parseResult.rows.length} 行：
            <span className="text-green-600"> {validRows.length} 条可导入</span>
            {invalidRows.length > 0 && (
              <span className="text-red-600">
                ，{invalidRows.length} 条有问题（不会导入）
              </span>
            )}
          </p>

          <div className="flex flex-col gap-2 rounded-xl border border-gray-200 bg-white p-3">
            {parseResult.rows.map((row) => (
              <div
                key={row.line}
                className={`rounded-lg border p-2 text-xs ${
                  row.errors.length > 0
                    ? "border-red-200 bg-red-50"
                    : "border-gray-100"
                }`}
              >
                <div className="flex justify-between">
                  <span>
                    {row.raw.date} · {row.raw.type} · {row.raw.currency}{" "}
                    {row.raw.amount} · {row.category ?? row.raw.category}
                  </span>
                  {row.note && <span className="text-gray-400">{row.note}</span>}
                </div>
                {row.errors.map((e, i) => (
                  <p key={i} className="mt-1 text-red-600">
                    {e}
                  </p>
                ))}
                {row.warnings.map((w, i) => (
                  <p key={i} className="mt-1 text-amber-600">
                    {w}
                  </p>
                ))}
              </div>
            ))}
          </div>

          {importError && <p className="text-sm text-red-600">{importError}</p>}

          <button
            type="button"
            onClick={handleConfirmImport}
            disabled={importing || validRows.length === 0}
            className="rounded-lg bg-blue-600 py-3 font-medium text-white disabled:opacity-50"
          >
            {importing ? "导入中..." : `确认导入 ${validRows.length} 条`}
          </button>
        </div>
      )}

      {imported !== null && (
        <p className="text-center text-sm text-green-600">
          已成功导入 {imported} 条记录
        </p>
      )}
    </div>
  );
}
