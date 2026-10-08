import { CATEGORY_META, type Filters, type RangePreset, type Segment } from "../lib/types";
import { PRESETS } from "../lib/analytics";
import { cn } from "../utils/cn";
import { ResetIcon } from "./icons";

const SEGMENTS: { key: Segment; label: string; emoji: string }[] = [
  { key: "all", label: "كل الأنواع", emoji: "🧩" },
  { key: "insecticide", label: CATEGORY_META.insecticide.label, emoji: CATEGORY_META.insecticide.emoji },
  { key: "fungicide", label: CATEGORY_META.fungicide.label, emoji: CATEGORY_META.fungicide.emoji },
  { key: "herbicide", label: CATEGORY_META.herbicide.label, emoji: CATEGORY_META.herbicide.emoji },
];

interface FilterBarProps {
  filters: Filters;
  resultCount: number;
  minDate: string;
  maxDate: string;
  onPreset: (preset: Exclude<RangePreset, "custom">) => void;
  onDateChange: (field: "from" | "to", value: string) => void;
  onSegment: (segment: Segment) => void;
  onReset: () => void;
}

const dateInputClass =
  "h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200";

const groupClass = "inline-flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800/80";

const pillClass = (active: boolean) =>
  cn(
    "rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200",
    active
      ? "bg-white text-indigo-600 shadow-sm dark:bg-slate-700 dark:text-indigo-300"
      : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
  );

export default function FilterBar({
  filters,
  resultCount,
  minDate,
  maxDate,
  onPreset,
  onDateChange,
  onSegment,
  onReset,
}: FilterBarProps) {
  return (
    <section
      aria-label="فلاتر لوحة المتابعة"
      className="sticky top-3 z-20 rounded-2xl border border-slate-200/70 bg-white/85 p-3 shadow-sm backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/85"
    >
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        {/* Segment filter */}
        <div role="group" aria-label="تصفية حسب نوع المبيد" className={groupClass}>
          {SEGMENTS.map((s) => (
            <button
              key={s.key}
              type="button"
              aria-pressed={filters.segment === s.key}
              onClick={() => onSegment(s.key)}
              className={pillClass(filters.segment === s.key)}
            >
              <span className="me-1">{s.emoji}</span>
              {s.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Date presets */}
          <div role="group" aria-label="نطاق زمني سريع" className={groupClass}>
            {PRESETS.map((p) => (
              <button
                key={p.key}
                type="button"
                aria-pressed={filters.preset === p.key}
                onClick={() => onPreset(p.key)}
                className={pillClass(filters.preset === p.key)}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Custom date range */}
          <label className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
            من
            <input
              type="date"
              value={filters.from}
              min={minDate}
              max={maxDate}
              onChange={(e) => onDateChange("from", e.target.value)}
              className={dateInputClass}
            />
          </label>
          <label className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
            إلى
            <input
              type="date"
              value={filters.to}
              min={minDate}
              max={maxDate}
              onChange={(e) => onDateChange("to", e.target.value)}
              className={dateInputClass}
            />
          </label>

          <button
            type="button"
            onClick={onReset}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <ResetIcon width={14} height={14} />
            إعادة الضبط
          </button>
        </div>
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 px-1 text-xs text-slate-500 dark:text-slate-400">
        <span>
          الفترة المعروضة: <strong className="text-slate-700 dark:text-slate-200">{filters.from}</strong> إلى{" "}
          <strong className="text-slate-700 dark:text-slate-200">{filters.to}</strong>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
          {resultCount.toLocaleString("en-US")} صنف كان في التجربة المعملية خلال الفترة
        </span>
      </div>
    </section>
  );
}
