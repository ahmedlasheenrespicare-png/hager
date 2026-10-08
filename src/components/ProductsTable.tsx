import { useEffect, useMemo, useState } from "react";
import { fmtInt, fmtMillions } from "../lib/analytics";
import { fmtDate, TODAY } from "../lib/dates";
import { CATEGORY_META, STATUS_META, type LabStatus, type ProductRecord } from "../lib/types";
import { cn } from "../utils/cn";
import Panel from "./Panel";
import { ChevronLeftIcon, ChevronRightIcon, DownloadIcon, SearchIcon, SortIcon } from "./icons";

type SortKey =
  | "code"
  | "name"
  | "category"
  | "origin"
  | "importDate"
  | "containers"
  | "value"
  | "progress"
  | "resultDate"
  | "status";
type SortDir = "asc" | "desc";

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: "code", label: "الكود" },
  { key: "name", label: "اسم الصنف" },
  { key: "category", label: "النوع" },
  { key: "origin", label: "بلد المنشأ" },
  { key: "importDate", label: "تاريخ الاستيراد" },
  { key: "containers", label: "العبوات" },
  { key: "value", label: "القيمة" },
  { key: "progress", label: "تقدم التجربة (سنتان)" },
  { key: "resultDate", label: "تاريخ النتيجة" },
  { key: "status", label: "الحالة" },
];

const STATUS_RANK: Record<LabStatus, number> = { pass: 0, fail: 1, pending: 2 };
const PAGE_SIZE = 8;

function sortValue(p: ProductRecord, key: SortKey): string | number {
  switch (key) {
    case "category":
      return CATEGORY_META[p.category].label;
    case "status":
      return STATUS_RANK[p.status];
    default:
      return p[key];
  }
}

function exportCsv(rows: ProductRecord[]) {
  const header = [
    "الكود",
    "اسم الصنف",
    "النوع",
    "بلد المنشأ",
    "تاريخ الاستيراد",
    "العبوات",
    "القيمة (ج.م)",
    "نسبة التقدم",
    "تاريخ النتيجة",
    "الحالة",
  ];
  const lines = rows.map((p) => [
    p.code,
    p.name,
    CATEGORY_META[p.category].label,
    p.origin,
    p.importDate,
    p.containers,
    p.value,
    `${Math.round(p.progress * 100)}%`,
    p.resultDate,
    STATUS_META[p.status].label,
  ]);
  const csv = [header, ...lines].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  // BOM so Excel opens Arabic text correctly
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `analysis-products-${TODAY}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ProductsTable({ products }: { products: ProductRecord[] }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | LabStatus>("all");
  const [sortKey, setSortKey] = useState<SortKey>("importDate");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const dir = sortDir === "asc" ? 1 : -1;
    return products
      .filter(
        (p) =>
          (status === "all" || p.status === status) &&
          (!q || [p.name, p.code, p.origin].some((v) => v.toLowerCase().includes(q)))
      )
      .sort((a, b) => {
        const va = sortValue(a, sortKey);
        const vb = sortValue(b, sortKey);
        if (typeof va === "string" && typeof vb === "string") return va.localeCompare(vb, "ar") * dir;
        return ((va as number) - (vb as number)) * dir;
      });
  }, [products, search, status, sortKey, sortDir]);

  // Reset to first page whenever the data or table filters change
  useEffect(() => {
    setPage(1);
  }, [products, search, status]);

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageRows = rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(["code", "name", "category", "origin"].includes(key) ? "asc" : "desc");
    }
  };

  const selectClass =
    "h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200";

  return (
    <Panel
      title="سجل الأصناف والعينات المعملية"
      subtitle="اضغط على عنوان أي عمود للفرز · الجدول يتحدث مع الفلاتر العامة للفترة والنوع"
      delay={200}
    >
      {/* Toolbar */}
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="relative block">
            <span className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-slate-400">
              <SearchIcon width={15} height={15} />
            </span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث بالاسم أو الكود أو بلد المنشأ…"
              className="h-9 w-full rounded-lg border border-slate-200 bg-white ps-9 pe-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 sm:w-72 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            />
          </label>
          <select value={status} onChange={(e) => setStatus(e.target.value as "all" | LabStatus)} className={selectClass} aria-label="تصفية حسب الحالة">
            <option value="all">كل الحالات</option>
            <option value="pass">مطابق</option>
            <option value="fail">غير مطابق</option>
            <option value="pending">قيد التحليل</option>
          </select>
        </div>
        <button
          type="button"
          onClick={() => exportCsv(rows)}
          disabled={rows.length === 0}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-3.5 text-sm font-semibold text-white shadow-sm shadow-indigo-500/30 transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <DownloadIcon width={15} height={15} />
          تصدير CSV
        </button>
      </div>

      {/* Table */}
      <div className="custom-scrollbar -mx-5 overflow-x-auto sm:-mx-6">
        <table className="w-full min-w-[980px] border-separate border-spacing-0 text-sm">
          <thead>
            <tr className="text-xs text-slate-500 dark:text-slate-400">
              {COLUMNS.map((c) => {
                const active = sortKey === c.key;
                return (
                  <th
                    key={c.key}
                    scope="col"
                    aria-sort={active ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
                    className="sticky top-0 border-b border-slate-200 bg-slate-50/90 px-4 py-2.5 text-start font-semibold backdrop-blur dark:border-slate-800 dark:bg-slate-800/90"
                  >
                    <button
                      type="button"
                      onClick={() => toggleSort(c.key)}
                      className={cn(
                        "inline-flex items-center gap-1 whitespace-nowrap transition-colors hover:text-slate-900 dark:hover:text-white",
                        active && "text-indigo-600 dark:text-indigo-400"
                      )}
                    >
                      {c.label}
                      <SortIcon
                        width={13}
                        height={13}
                        className={cn("transition-opacity", active ? "opacity-100" : "opacity-40")}
                      />
                      {active && <span className="text-[10px]">{sortDir === "asc" ? "▲" : "▼"}</span>}
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((p) => {
              const meta = STATUS_META[p.status];
              return (
                <tr
                  key={p.code}
                  className="group transition-colors duration-200 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                >
                  <td className="border-b border-slate-100 px-4 py-3 font-mono text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
                    {p.code}
                  </td>
                  <td className="whitespace-nowrap border-b border-slate-100 px-4 py-3 font-semibold text-slate-800 dark:border-slate-800 dark:text-slate-100">
                    {p.name}
                  </td>
                  <td className="whitespace-nowrap border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                    <span className="inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                      <span>{CATEGORY_META[p.category].emoji}</span>
                      {CATEGORY_META[p.category].label}
                    </span>
                  </td>
                  <td className="whitespace-nowrap border-b border-slate-100 px-4 py-3 text-slate-600 dark:border-slate-800 dark:text-slate-300">
                    {p.origin}
                  </td>
                  <td className="whitespace-nowrap border-b border-slate-100 px-4 py-3 tabular-nums text-slate-600 dark:border-slate-800 dark:text-slate-300">
                    {fmtDate(p.importDate)}
                  </td>
                  <td className="border-b border-slate-100 px-4 py-3 tabular-nums text-slate-700 dark:border-slate-800 dark:text-slate-200">
                    {fmtInt(p.containers)}
                  </td>
                  <td className="whitespace-nowrap border-b border-slate-100 px-4 py-3 tabular-nums text-slate-700 dark:border-slate-800 dark:text-slate-200">
                    {fmtMillions(p.value)}
                  </td>
                  <td className="min-w-[170px] border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                        <div
                          className="h-full rounded-full transition-all duration-700 ease-out"
                          style={{ width: `${Math.round(p.progress * 100)}%`, background: meta.color }}
                        />
                      </div>
                      <span className="w-10 text-end text-xs tabular-nums text-slate-500 dark:text-slate-400">
                        {Math.round(p.progress * 100)}%
                      </span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap border-b border-slate-100 px-4 py-3 tabular-nums text-slate-600 dark:border-slate-800 dark:text-slate-300">
                    {fmtDate(p.resultDate)}
                    <div className="text-[11px] text-slate-500 dark:text-slate-500">
                      {p.status === "pending" ? `بعد ${fmtInt(p.daysRemaining)} يوم` : "صدرت النتيجة"}
                    </div>
                  </td>
                  <td className="whitespace-nowrap border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold", meta.soft)}>
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.color }} />
                      {meta.label}
                    </span>
                  </td>
                </tr>
              );
            })}
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={COLUMNS.length} className="px-4 py-14 text-center text-sm text-slate-500 dark:text-slate-400">
                  لا توجد نتائج تطابق الفلاتر الحالية
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex flex-col items-center justify-between gap-3 text-sm text-slate-500 dark:text-slate-400 sm:flex-row">
        <span>
          عرض {rows.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}–
          {Math.min(currentPage * PAGE_SIZE, rows.length)} من {fmtInt(rows.length)} صنف
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            aria-label="الصفحة السابقة"
            className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 transition hover:bg-slate-100 disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            <ChevronRightIcon width={15} height={15} />
          </button>
          <span className="min-w-[90px] text-center tabular-nums">
            صفحة {currentPage} من {pageCount}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
            disabled={currentPage >= pageCount}
            aria-label="الصفحة التالية"
            className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 transition hover:bg-slate-100 disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            <ChevronLeftIcon width={15} height={15} />
          </button>
        </div>
      </div>
    </Panel>
  );
}
