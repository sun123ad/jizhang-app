"use client";

import { useState } from "react";
import { EXPENSE_CATEGORIES } from "@/lib/types";

const CATEGORY_COLORS: Record<string, string> = {
  餐饮: "#2a78d6",
  交通: "#eb6834",
  房租: "#1baf7a",
  购物: "#eda100",
  娱乐: "#e87ba4",
  其他: "#008300",
};
// Slots 7-8 of the categorical palette, for user-added custom categories.
const EXTRA_COLORS = ["#4a3aa7", "#e34948"];
const FALLBACK_COLOR = "#898781";

type ViewMode = "list" | "donut";

const SIZE = 200;
const CENTER = SIZE / 2;
const RADIUS = 76;
const STROKE_WIDTH = 30;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const SEGMENT_GAP = 2;

export function CategoryBreakdown({
  categoryList,
  currency,
}: {
  categoryList: [string, number][];
  currency: string;
}) {
  const [view, setView] = useState<ViewMode>("list");
  const [hovered, setHovered] = useState<string | null>(null);

  const maxCategory = categoryList[0]?.[1] ?? 0;
  const total = categoryList.reduce((sum, [, amt]) => sum + amt, 0);

  // Fixed categories first (stable color/position month to month), then any
  // custom categories in alphabetical order so their colors stay stable too.
  const customCats = categoryList
    .map(([cat]) => cat)
    .filter((cat) => !(EXPENSE_CATEGORIES as readonly string[]).includes(cat))
    .sort((a, b) => a.localeCompare(b, "zh"));
  const allCats = [...EXPENSE_CATEGORIES, ...customCats];
  const colorMap = new Map<string, string>(
    allCats.map((cat, i) => [
      cat,
      CATEGORY_COLORS[cat] ??
        EXTRA_COLORS[i - EXPENSE_CATEGORIES.length] ??
        FALLBACK_COLOR,
    ]),
  );

  const ordered = allCats
    .map((cat) => [cat, categoryList.find(([c]) => c === cat)?.[1] ?? 0] as [string, number])
    .filter(([, amt]) => amt > 0);

  const drawable = CIRCUMFERENCE - ordered.length * SEGMENT_GAP;
  const lengths = ordered.map(([, amt]) => (total > 0 ? (amt / total) * drawable : 0));
  // Prefix sum of each segment's length + gap, i.e. where each segment starts
  // along the ring. Built as a fresh array (no outer variable mutated).
  const offsets = lengths.reduce<number[]>((acc, length, i) => {
    acc.push(i === 0 ? 0 : acc[i - 1] + lengths[i - 1] + SEGMENT_GAP);
    return acc;
  }, []);
  const segments = ordered.map(([cat, amt], i) => ({
    cat,
    amt,
    color: colorMap.get(cat)!,
    dashArray: `${lengths[i]} ${CIRCUMFERENCE - lengths[i]}`,
    dashOffset: -offsets[i],
  }));

  const hoveredEntry = ordered.find(([cat]) => cat === hovered);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm text-gray-500">支出分类占比</p>
        <div className="flex rounded-lg bg-gray-100 p-1 text-xs">
          <button
            type="button"
            onClick={() => setView("list")}
            className={`rounded-md px-3 py-1 ${
              view === "list" ? "bg-white shadow font-medium" : "text-gray-500"
            }`}
          >
            列表
          </button>
          <button
            type="button"
            onClick={() => setView("donut")}
            className={`rounded-md px-3 py-1 ${
              view === "donut" ? "bg-white shadow font-medium" : "text-gray-500"
            }`}
          >
            占比图
          </button>
        </div>
      </div>

      {categoryList.length === 0 && (
        <p className="text-sm text-gray-400">本月还没有支出记录</p>
      )}

      {categoryList.length > 0 && view === "list" && (
        <div className="flex flex-col gap-2">
          {categoryList.map(([cat, amt]) => (
            <div key={cat}>
              <div className="mb-1 flex justify-between text-sm">
                <span>{cat}</span>
                <span>{amt.toFixed(2)}</span>
              </div>
              <div className="h-2 rounded-full bg-gray-100">
                <div
                  className="h-2 rounded-full bg-blue-500"
                  style={{
                    width: `${maxCategory ? (amt / maxCategory) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {categoryList.length > 0 && view === "donut" && (
        <div className="flex flex-col items-center gap-4">
          <div className="relative" style={{ width: SIZE, height: SIZE }}>
            <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
              <g transform={`rotate(-90 ${CENTER} ${CENTER})`}>
                {segments.map((s) => (
                  <circle
                    key={s.cat}
                    cx={CENTER}
                    cy={CENTER}
                    r={RADIUS}
                    fill="none"
                    stroke={s.color}
                    strokeWidth={STROKE_WIDTH}
                    strokeDasharray={s.dashArray}
                    strokeDashoffset={s.dashOffset}
                    onMouseEnter={() => setHovered(s.cat)}
                    onMouseLeave={() => setHovered(null)}
                    style={{
                      cursor: "pointer",
                      opacity: hovered && hovered !== s.cat ? 0.4 : 1,
                      transition: "opacity 0.15s",
                    }}
                  >
                    <title>
                      {`${s.cat} ${s.amt.toFixed(2)} ${currency}（${
                        total ? ((s.amt / total) * 100).toFixed(1) : "0"
                      }%）`}
                    </title>
                  </circle>
                ))}
              </g>
            </svg>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              {hoveredEntry ? (
                <>
                  <p className="text-xs text-gray-500">{hoveredEntry[0]}</p>
                  <p className="text-xl font-semibold">
                    {hoveredEntry[1].toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-400">
                    {total ? ((hoveredEntry[1] / total) * 100).toFixed(1) : "0"}%
                  </p>
                </>
              ) : (
                <>
                  <p className="text-xs text-gray-500">支出总计</p>
                  <p className="text-xl font-semibold">{total.toFixed(2)}</p>
                  <p className="text-xs text-gray-400">{currency}</p>
                </>
              )}
            </div>
          </div>

          <div className="flex w-full flex-wrap gap-x-4 gap-y-2 text-sm">
            {ordered.map(([cat, amt]) => (
              <div key={cat} className="flex items-center gap-1.5">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: colorMap.get(cat) }}
                />
                <span>{cat}</span>
                <span className="text-gray-400">
                  {amt.toFixed(2)} · {total ? ((amt / total) * 100).toFixed(0) : "0"}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
