"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/lib/AuthProvider";
import { useTransactions } from "@/lib/useTransactions";
import { useMembers } from "@/lib/useMembers";
import { buildMarkdown } from "@/lib/exportMarkdown";
import { markExported } from "@/lib/reminder";
import { ImportTransactions } from "@/app/components/ImportTransactions";

type Range = "month" | "quarter" | "all";

function computeRange(range: Range) {
  const now = new Date();
  if (range === "all") {
    return { from: undefined, to: undefined, label: "全部" };
  }
  if (range === "month") {
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    return {
      from: first.toISOString().slice(0, 10),
      to: now.toISOString().slice(0, 10),
      label: `${now.getFullYear()}年${now.getMonth() + 1}月`,
    };
  }
  const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
  const first = new Date(now.getFullYear(), quarterStartMonth, 1);
  return {
    from: first.toISOString().slice(0, 10),
    to: now.toISOString().slice(0, 10),
    label: `${now.getFullYear()}年第${Math.floor(now.getMonth() / 3) + 1}季度`,
  };
}

const RANGE_OPTIONS: [Range, string][] = [
  ["month", "本月"],
  ["quarter", "本季度"],
  ["all", "全部"],
];

type Mode = "export" | "import";

export default function ExportPage() {
  const { ledgerId } = useAuth();
  const [mode, setMode] = useState<Mode>("export");
  const [range, setRange] = useState<Range>("month");
  const { from, to, label } = useMemo(() => computeRange(range), [range]);
  const { transactions, loading } = useTransactions(ledgerId, { from, to });
  const members = useMembers(ledgerId);
  const [justExported, setJustExported] = useState(false);

  function handleExport() {
    const markdown = buildMarkdown(transactions, members, label);
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const today = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `账本备份_${today}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    markExported();
    setJustExported(true);
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">
        {mode === "export" ? "导出备份" : "批量导入"}
      </h1>

      <div className="flex rounded-lg bg-gray-100 p-1 text-sm">
        <button
          onClick={() => setMode("export")}
          className={`flex-1 rounded-md py-2 ${
            mode === "export" ? "bg-white shadow font-medium" : "text-gray-500"
          }`}
        >
          导出
        </button>
        <button
          onClick={() => setMode("import")}
          className={`flex-1 rounded-md py-2 ${
            mode === "import" ? "bg-white shadow font-medium" : "text-gray-500"
          }`}
        >
          导入
        </button>
      </div>

      {mode === "export" && (
        <>
          <div className="flex rounded-lg bg-gray-100 p-1 text-sm">
            {RANGE_OPTIONS.map(([value, text]) => (
              <button
                key={value}
                onClick={() => {
                  setRange(value);
                  setJustExported(false);
                }}
                className={`flex-1 rounded-md py-2 ${
                  range === value ? "bg-white shadow font-medium" : "text-gray-500"
                }`}
              >
                {text}
              </button>
            ))}
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 text-sm text-gray-600">
            <p>
              范围：{label}，共 {loading ? "..." : transactions.length} 条记录
            </p>
            <p className="mt-1 text-gray-400">
              导出为 Markdown 文件，可以直接发给 AI 分析消费情况，也可以本地留存一份备份。
            </p>
          </div>

          <button
            onClick={handleExport}
            disabled={loading || transactions.length === 0}
            className="rounded-lg bg-blue-600 py-3 font-medium text-white disabled:opacity-50"
          >
            导出 Markdown
          </button>

          {justExported && (
            <p className="text-center text-sm text-green-600">
              已导出，文件已保存到浏览器的&ldquo;下载&rdquo;目录
            </p>
          )}
        </>
      )}

      {mode === "import" && <ImportTransactions />}
    </div>
  );
}
