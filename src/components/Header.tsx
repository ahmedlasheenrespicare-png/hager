import { useTheme } from "../context/ThemeContext";
import { fmtDate, TODAY } from "../lib/dates";
import { MoonIcon, SunIcon } from "./icons";

export default function Header() {
  const { isDark, toggle } = useTheme();

  return (
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex min-w-0 items-center gap-4">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 text-2xl shadow-lg shadow-indigo-500/30">
          🧪
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            لوحة متابعة الإدارة · بيانات مباشرة
          </div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            لوحة متابعة تحليل عبوات المبيدات
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            التجربة المعملية لمدة سنتين · نتائج التحليل والمطابقة · الدورات التدريبية · آخر تحديث {fmtDate(TODAY)}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={toggle}
        aria-label={isDark ? "التبديل إلى الوضع الفاتح" : "التبديل إلى الوضع الداكن"}
        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
      >
        {isDark ? <SunIcon className="text-amber-400" /> : <MoonIcon className="text-indigo-500" />}
        {isDark ? "الوضع الفاتح" : "الوضع الداكن"}
      </button>
    </header>
  );
}
