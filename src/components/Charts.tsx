import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Sector,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useTheme } from "../context/ThemeContext";
import { CATEGORY_META, STATUS_META, TRAINING_META, type Segment } from "../lib/types";
import { CATEGORIES, fmtInt, fmtPct, type Dashboard, type MonthPoint, type OriginRow } from "../lib/analytics";
import { cn } from "../utils/cn";
import ChartTooltip from "./ChartTooltip";

/** Colours that adapt to light / dark mode for axes, grid and cursors. */
function useChartTheme() {
  const { isDark } = useTheme();
  return {
    grid: isDark ? "#1e293b" : "#e2e8f0",
    tick: isDark ? "#94a3b8" : "#64748b",
    cursor: isDark ? "#475569" : "#94a3b8",
    cursorFill: isDark ? "rgba(148,163,184,0.08)" : "rgba(100,116,139,0.08)",
  };
}

export function ChartLegend({ items }: { items: { name: string; color: string }[] }) {
  return (
    <ul className="mb-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-600 dark:text-slate-300">
      {items.map((i) => (
        <li key={i.name} className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: i.color }} />
          {i.name}
        </li>
      ))}
    </ul>
  );
}

function Empty({ text = "لا توجد بيانات في الفترة والفلاتر المحددة" }: { text?: string }) {
  return (
    <div className="grid h-[260px] place-items-center rounded-xl border border-dashed border-slate-300 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
      {text}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 1) Line chart – monthly trend
// ---------------------------------------------------------------------------
export function TrendLineChart({ data }: { data: MonthPoint[] }) {
  const t = useChartTheme();
  if (data.length === 0) return <Empty />;

  return (
    <>
      <ChartLegend
        items={[
          { name: "الأصناف الواردة", color: "#6366f1" },
          { name: "نتيجة مطابقة", color: STATUS_META.pass.color },
          { name: "نتيجة غير مطابقة", color: STATUS_META.fail.color },
        ]}
      />
      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
            <CartesianGrid stroke={t.grid} strokeDasharray="4 4" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: t.tick, fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              minTickGap={18}
            />
            <YAxis allowDecimals={false} tick={{ fill: t.tick, fontSize: 11 }} tickLine={false} axisLine={false} width={36} />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: t.cursor, strokeDasharray: "3 3" }} />
            <Line
              type="monotone"
              dataKey="imported"
              name="الأصناف الواردة"
              stroke="#6366f1"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, strokeWidth: 0 }}
              isAnimationActive
              animationDuration={900}
            />
            <Line
              type="monotone"
              dataKey="pass"
              name="نتيجة مطابقة"
              stroke={STATUS_META.pass.color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5, strokeWidth: 0 }}
              isAnimationActive
              animationDuration={900}
            />
            <Line
              type="monotone"
              dataKey="fail"
              name="نتيجة غير مطابقة"
              stroke={STATUS_META.fail.color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5, strokeWidth: 0 }}
              isAnimationActive
              animationDuration={900}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// 2) Donut – status distribution
// ---------------------------------------------------------------------------
const renderActiveSector = (props: any) => <Sector {...props} outerRadius={props.outerRadius + 7} />;

export function StatusDonut({ data, total }: { data: Dashboard["statusData"]; total: number }) {
  const [hover, setHover] = useState<number | null>(null);

  if (total === 0) return <Empty />;

  const active = hover !== null ? data[hover] : null;
  const pct = (v: number) => fmtPct(total ? v / total : null, 0);

  return (
    <div>
      <div className="relative mx-auto h-[210px] w-full max-w-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius="66%"
              outerRadius="90%"
              paddingAngle={3}
              cornerRadius={6}
              stroke="none"
              isAnimationActive
              animationDuration={800}
              activeShape={renderActiveSector}
              onMouseEnter={(_: unknown, index: number) => setHover(index)}
              onMouseLeave={() => setHover(null)}
            >
              {data.map((d) => (
                <Cell key={d.key} fill={d.color} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip valueFormatter={(v) => `${fmtInt(v)} صنف`} />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-extrabold tabular-nums text-slate-900 dark:text-white">
            {fmtInt(active ? active.value : total)}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {active ? `${active.name} · ${pct(active.value)}` : "إجمالي الأصناف"}
          </span>
        </div>
      </div>

      <ul className="mt-4 space-y-1">
        {data.map((d, i) => (
          <li
            key={d.key}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
            className={cn(
              "flex items-center justify-between rounded-lg px-2.5 py-1.5 text-sm transition-colors duration-200",
              hover === i ? "bg-slate-100 dark:bg-slate-800" : ""
            )}
          >
            <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
              {d.name}
            </span>
            <span className="font-semibold tabular-nums text-slate-900 dark:text-white">
              {fmtInt(d.value)} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">({pct(d.value)})</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 3) Stacked bar – status per product category
// ---------------------------------------------------------------------------
export function CategoryBarChart({ data }: { data: Dashboard["categoryBars"] }) {
  const t = useChartTheme();
  const total = data.reduce((s, d) => s + d.pass + d.fail + d.pending, 0);
  if (total === 0) return <Empty />;

  return (
    <>
      <ChartLegend
        items={[
          { name: "مطابق", color: STATUS_META.pass.color },
          { name: "غير مطابق", color: STATUS_META.fail.color },
          { name: "قيد التحليل", color: STATUS_META.pending.color },
        ]}
      />
      <div className="h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }} barCategoryGap="28%">
            <CartesianGrid stroke={t.grid} strokeDasharray="4 4" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: t.tick, fontSize: 12 }} tickLine={false} axisLine={false} />
            <YAxis allowDecimals={false} tick={{ fill: t.tick, fontSize: 11 }} tickLine={false} axisLine={false} width={36} />
            <Tooltip
              cursor={{ fill: t.cursorFill }}
              content={
                <ChartTooltip
                  footer={(row) => `الإجمالي: ${fmtInt(row.pass + row.fail + row.pending)} صنف`}
                />
              }
            />
            <Bar dataKey="pass" name="مطابق" stackId="s" fill={STATUS_META.pass.color} isAnimationActive animationDuration={700} />
            <Bar dataKey="fail" name="غير مطابق" stackId="s" fill={STATUS_META.fail.color} isAnimationActive animationDuration={700} />
            <Bar
              dataKey="pending"
              name="قيد التحليل"
              stackId="s"
              fill={STATUS_META.pending.color}
              radius={[6, 6, 0, 0]}
              isAnimationActive
              animationDuration={700}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// 4) Stacked bar – training attendees per quarter
// ---------------------------------------------------------------------------
const TRAINING_KEYS = ["insecticide", "fungicide", "herbicide", "general"] as const;

export function TrainingBarChart({
  data,
  segment,
}: {
  data: Dashboard["trainingQuarters"];
  segment: Segment;
}) {
  const t = useChartTheme();
  const series = TRAINING_KEYS.filter((k) => segment === "all" || k === segment);
  const hasData = data.some((row) => series.some((k) => Number(row[k]) > 0));
  if (!hasData) return <Empty text="لا توجد دورات تدريبية في الفترة والفلاتر المحددة" />;

  return (
    <>
      <ChartLegend items={series.map((k) => ({ name: TRAINING_META[k].label, color: TRAINING_META[k].color }))} />
      <div className="h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }} barCategoryGap="22%">
            <CartesianGrid stroke={t.grid} strokeDasharray="4 4" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: t.tick, fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={8} />
            <YAxis tick={{ fill: t.tick, fontSize: 11 }} tickLine={false} axisLine={false} width={44} tickFormatter={(v) => fmtInt(v)} />
            <Tooltip
              cursor={{ fill: t.cursorFill }}
              content={
                <ChartTooltip
                  valueFormatter={(v) => `${fmtInt(v)} متدرب`}
                  footer={(row) =>
                    `الدورات: ${fmtInt(row.courses)} · الساعات: ${fmtInt(row.hours)} · التقييم: ${row.rating ?? "—"} / 5`
                  }
                />
              }
            />
            {series.map((k, i) => (
              <Bar
                key={k}
                dataKey={k}
                name={TRAINING_META[k].label}
                stackId="t"
                fill={TRAINING_META[k].color}
                radius={i === series.length - 1 ? [6, 6, 0, 0] : 0}
                isAnimationActive
                animationDuration={700}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// 5) Horizontal stacked bar – containers by country of origin
// ---------------------------------------------------------------------------
export function OriginBarChart({ data, segment }: { data: OriginRow[]; segment: Segment }) {
  const t = useChartTheme();
  const series = CATEGORIES.filter((c) => segment === "all" || c === segment);
  if (data.length === 0) return <Empty />;

  return (
    <>
      <ChartLegend items={series.map((c) => ({ name: CATEGORY_META[c].label, color: CATEGORY_META[c].color }))} />
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 4, bottom: 0 }} barCategoryGap="22%">
            <CartesianGrid stroke={t.grid} strokeDasharray="4 4" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fill: t.tick, fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={92}
              tick={{ fill: t.tick, fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              cursor={{ fill: t.cursorFill }}
              content={
                <ChartTooltip
                  valueFormatter={(v) => `${fmtInt(v)} عبوة`}
                  footer={(row) => `${fmtInt(row.count)} صنف · ${fmtPct(row.share)} من إجمالي العبوات`}
                />
              }
            />
            {series.map((c, i) => (
              <Bar
                key={c}
                dataKey={c}
                name={CATEGORY_META[c].label}
                stackId="o"
                fill={CATEGORY_META[c].color}
                radius={i === series.length - 1 ? [0, 6, 6, 0] : 0}
                isAnimationActive
                animationDuration={700}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}

