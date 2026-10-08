import { useId } from "react";
import type { Kpi, Tone } from "../lib/analytics";
import { cn } from "../utils/cn";
import { ArrowDownIcon, ArrowUpIcon } from "./icons";

const TONE: Record<Tone, { bg: string; stroke: string }> = {
  indigo: { bg: "bg-indigo-500/10", stroke: "#6366f1" },
  emerald: { bg: "bg-emerald-500/10", stroke: "#10b981" },
  amber: { bg: "bg-amber-500/10", stroke: "#f59e0b" },
  sky: { bg: "bg-sky-500/10", stroke: "#0ea5e9" },
  violet: { bg: "bg-violet-500/10", stroke: "#8b5cf6" },
  rose: { bg: "bg-rose-500/10", stroke: "#f43f5e" },
};

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const gradientId = `spark-${useId().replace(/:/g, "")}`;
  if (data.length < 2) return null;

  const w = 100;
  const h = 40;
  const max = Math.max(...data);
  const min = Math.min(...data, 0);
  const span = max - min || 1;
  const pts = data.map((v, i) => [(i / (data.length - 1)) * w, h - 3 - ((v - min) / span) * (h - 6)] as const);
  const line = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
  const area = `${line} L${w},${h} L0,${h} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="h-full w-full overflow-visible">
      <defs>
        <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradientId})`} className="transition-all duration-700" />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth={2}
        vectorEffect="non-scaling-stroke"
        strokeLinejoin="round"
        strokeLinecap="round"
        className="transition-all duration-700"
      />
    </svg>
  );
}

export default function KpiCard({ kpi, index }: { kpi: Kpi; index: number }) {
  const tone = TONE[kpi.tone];
  const hasTrend = kpi.trend !== null && Number.isFinite(kpi.trend);
  const trend = hasTrend ? (kpi.trend as number) : 0;
  const up = trend >= 0;
  const isGood = kpi.goodWhenUp === null ? null : up === kpi.goodWhenUp;

  const badgeTone = !hasTrend || kpi.goodWhenUp === null
    ? "bg-slate-500/10 text-slate-600 dark:text-slate-300"
    : isGood
      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
      : "bg-rose-500/10 text-rose-600 dark:text-rose-400";

  return (
    <article
      className="animate-fade-up group relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-300/40 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none dark:hover:shadow-black/40"
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{kpi.label}</p>
        <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl text-lg", tone.bg)}>{kpi.icon}</span>
      </div>

      <p key={kpi.value} className="animate-fade-up mt-3 text-3xl font-extrabold tabular-nums tracking-tight text-slate-900 dark:text-white">
        {kpi.value}
      </p>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums transition-colors duration-500",
            badgeTone
          )}
        >
          {hasTrend && (up ? <ArrowUpIcon width={12} height={12} /> : <ArrowDownIcon width={12} height={12} />)}
          {hasTrend ? `${up ? "+" : "−"}${Math.abs(trend).toFixed(1)}${kpi.trendUnit === "pp" ? " نقطة" : "%"}` : "—"}
        </span>
        <span className="text-xs text-slate-500 dark:text-slate-400">مقارنة بالفترة السابقة</span>
      </div>

      <p className="mt-1.5 truncate text-xs text-slate-500 dark:text-slate-400" title={kpi.sub}>
        {kpi.sub}
      </p>

      <div className="mt-3 h-10">
        <Sparkline data={kpi.spark} color={tone.stroke} />
      </div>
    </article>
  );
}
