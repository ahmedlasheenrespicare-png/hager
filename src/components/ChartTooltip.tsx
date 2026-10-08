import type { ReactNode } from "react";

interface ChartTooltipProps {
  active?: boolean;
  payload?: readonly any[];
  label?: ReactNode;
  valueFormatter?: (value: number, name: string) => string;
  footer?: (row: any) => ReactNode;
}

/** Shared, theme-aware tooltip used by every Recharts chart. */
export default function ChartTooltip({ active, payload, label, valueFormatter, footer }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const items = payload.filter((p) => p && p.name && p.value !== undefined && p.value !== null);
  if (items.length === 0) return null;

  const row = items[0]?.payload;

  return (
    <div className="min-w-[170px] max-w-[240px] rounded-xl border border-slate-200 bg-white/95 px-3.5 py-2.5 text-xs shadow-xl shadow-slate-900/10 backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/95 dark:shadow-black/50">
      {label !== undefined && label !== null && label !== "" && (
        <p className="mb-1.5 border-b border-slate-100 pb-1.5 font-bold text-slate-800 dark:border-slate-800 dark:text-slate-100">
          {label}
        </p>
      )}
      <ul className="space-y-1.5">
        {items.map((p) => (
          <li key={`${p.dataKey ?? p.name}`} className="flex items-center justify-between gap-5">
            <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ background: p.color ?? p.payload?.fill ?? p.fill }}
              />
              {p.name}
            </span>
            <span className="font-semibold tabular-nums text-slate-900 dark:text-white">
              {valueFormatter ? valueFormatter(Number(p.value), String(p.name)) : Number(p.value).toLocaleString("en-US")}
            </span>
          </li>
        ))}
      </ul>
      {footer && row && (
        <div className="mt-2 border-t border-slate-100 pt-2 text-[11px] text-slate-500 dark:border-slate-800 dark:text-slate-400">
          {footer(row)}
        </div>
      )}
    </div>
  );
}
