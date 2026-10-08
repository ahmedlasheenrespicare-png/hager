import type { ReactNode } from "react";
import { cn } from "../utils/cn";

interface PanelProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  delay?: number;
}

export default function Panel({ title, subtitle, action, children, className, delay = 0 }: PanelProps) {
  return (
    <section
      className={cn(
        "animate-fade-up min-w-0 rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm shadow-slate-200/50 sm:p-6",
        "dark:border-slate-800 dark:bg-slate-900 dark:shadow-none",
        className
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{subtitle}</p>}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}
