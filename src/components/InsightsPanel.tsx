import type { Insight } from "../lib/analytics";

export default function InsightsPanel({ insights }: { insights: Insight[] }) {
  return (
    <ul className="space-y-3">
      {insights.map((item, idx) => (
        <li
          key={item.id}
          className="animate-fade-up flex gap-3 rounded-xl border border-slate-200/70 bg-slate-50/70 p-3.5 transition hover:border-indigo-300/60 dark:border-slate-800 dark:bg-slate-800/40 dark:hover:border-indigo-500/40"
          style={{ animationDelay: `${idx * 80}ms` }}
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-lg shadow-sm dark:bg-slate-800">
            {item.icon}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{item.title}</p>
            <p key={item.value} className="animate-fade-up truncate text-sm font-bold text-slate-900 dark:text-white" title={item.value}>
              {item.value}
            </p>
            <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">{item.detail}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
