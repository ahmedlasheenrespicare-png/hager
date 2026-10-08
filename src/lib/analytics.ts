import {
  CATEGORY_META,
  STATUS_META,
  type Category,
  type Filters,
  type LabStatus,
  type ProductRecord,
  type RangePreset,
  type Segment,
  type TrainingRecord,
} from "./types";
import {
  addDays,
  DATA_START,
  diffDays,
  monthKey,
  monthLabel,
  quarterKey,
  quarterLabel,
  TODAY,
} from "./dates";

export const CATEGORIES: Category[] = ["insecticide", "fungicide", "herbicide"];

export const PRESETS: { key: Exclude<RangePreset, "custom">; label: string }[] = [
  { key: "6m", label: "6 شهور" },
  { key: "12m", label: "12 شهر" },
  { key: "24m", label: "24 شهر" },
  { key: "all", label: "كل الفترة" },
];

const PRESET_DAYS: Record<Exclude<RangePreset, "custom">, number> = {
  "6m": 182,
  "12m": 365,
  "24m": 730,
  all: 0,
};

export function presetRange(preset: Exclude<RangePreset, "custom">) {
  return {
    from: preset === "all" ? DATA_START : addDays(TODAY, -PRESET_DAYS[preset]),
    to: TODAY,
  };
}

/** The window of identical length right before the selected range (used for trend indicators). */
export function previousRange(from: string, to: string) {
  const len = diffDays(from, to) + 1;
  return { from: addDays(from, -len), to: addDays(from, -1) };
}

type RangeSegment = Pick<Filters, "from" | "to" | "segment">;

const inRange = (d: string, from: string, to: string) => d >= from && d <= to;
const matchSeg = (c: Category, seg: Segment) => seg === "all" || c === seg;

/**
 * A product belongs to a period when its 2-year lab test overlaps the period:
 * it was registered on/before the end date AND its result is due on/after the start date.
 * This keeps both pending and already-issued results visible for any window.
 */
export function filterProducts(products: ProductRecord[], f: RangeSegment) {
  return products.filter(
    (p) => p.importDate <= f.to && p.resultDate >= f.from && matchSeg(p.category, f.segment)
  );
}

export function filterTrainings(trainings: TrainingRecord[], f: RangeSegment) {
  return trainings.filter(
    (t) => inRange(t.date, f.from, f.to) && (f.segment === "all" || t.category === f.segment)
  );
}

// ---------- formatters ----------
export const fmtInt = (n: number) => Math.round(n).toLocaleString("en-US");
export const fmtMillions = (n: number) =>
  `${(n / 1_000_000).toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} م.ج`;
export const fmtPct = (n: number | null, digits = 1) => (n === null ? "—" : `${(n * 100).toFixed(digits)}%`);

// ---------- types ----------
export type Tone = "indigo" | "emerald" | "amber" | "sky" | "violet" | "rose";

export interface Kpi {
  id: string;
  label: string;
  value: string;
  sub: string;
  trend: number | null;
  trendUnit: "%" | "pp";
  goodWhenUp: boolean | null;
  icon: string;
  tone: Tone;
  spark: number[];
}

export interface MonthPoint {
  key: string;
  label: string;
  imported: number;
  pass: number;
  fail: number;
  pending: number;
  containers: number;
  value: number;
  trainings: number;
}

export interface Insight {
  id: string;
  icon: string;
  title: string;
  value: string;
  detail: string;
}

export interface Totals {
  count: number;
  containers: number;
  liters: number;
  value: number;
  pass: number;
  fail: number;
  pending: number;
  completed: number;
  passRate: number | null;
  avgRemaining: number | null;
  trainCount: number;
  attendees: number;
  hours: number;
}

export interface OriginRow {
  name: string;
  total: number;
  insecticide: number;
  fungicide: number;
  herbicide: number;
  count: number;
  share: number;
}

export interface Dashboard {
  kpis: Kpi[];
  totals: Totals;
  monthly: MonthPoint[];
  statusData: { key: LabStatus; name: string; value: number; color: string }[];
  categoryBars: { key: Category; name: string; fullName: string; pass: number; fail: number; pending: number }[];
  trainingQuarters: Record<string, string | number | null>[];
  origins: OriginRow[];
  insights: Insight[];
  products: ProductRecord[];
  trainings: TrainingRecord[];
}

// ---------- helpers ----------
function buildMonthKeys(from: string, to: string): string[] {
  const start = from < DATA_START ? DATA_START : from;
  const end = to > TODAY ? TODAY : to;
  if (start > end) return [];
  let [y, m] = start.slice(0, 7).split("-").map(Number);
  const [ey, em] = end.slice(0, 7).split("-").map(Number);
  const keys: string[] = [];
  while (y < ey || (y === ey && m <= em)) {
    keys.push(`${y}-${String(m).padStart(2, "0")}`);
    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
  }
  return keys;
}

function computeTotals(ps: ProductRecord[], ts: TrainingRecord[]): Totals {
  const pass = ps.filter((p) => p.status === "pass").length;
  const fail = ps.filter((p) => p.status === "fail").length;
  const pendingList = ps.filter((p) => p.status === "pending");
  const completed = pass + fail;
  return {
    count: ps.length,
    containers: ps.reduce((s, p) => s + p.containers, 0),
    liters: ps.reduce((s, p) => s + p.containers * p.packSize, 0),
    value: ps.reduce((s, p) => s + p.value, 0),
    pass,
    fail,
    pending: pendingList.length,
    completed,
    passRate: completed ? pass / completed : null,
    avgRemaining: pendingList.length
      ? pendingList.reduce((s, p) => s + p.daysRemaining, 0) / pendingList.length
      : null,
    trainCount: ts.length,
    attendees: ts.reduce((s, t) => s + t.attendees, 0),
    hours: ts.reduce((s, t) => s + t.hours, 0),
  };
}

const trendOf = (cur: number, prev: number) => (prev === 0 ? null : ((cur - prev) / prev) * 100);

// ---------- main aggregation: every view is derived from the same filtered data ----------
export function buildDashboard(
  f: Filters,
  allProducts: ProductRecord[],
  allTrainings: TrainingRecord[]
): Dashboard {
  const prevR = previousRange(f.from, f.to);

  const products = filterProducts(allProducts, f);
  const trainings = filterTrainings(allTrainings, f);
  const prevProducts = filterProducts(allProducts, { ...f, ...prevR });
  const prevTrainings = filterTrainings(allTrainings, { ...f, ...prevR });

  const totals = computeTotals(products, trainings);
  const prevTotals = computeTotals(prevProducts, prevTrainings);

  // Monthly series (by registration month)
  const monthKeys = buildMonthKeys(f.from, f.to);
  // Registrations are bucketed by import month; results are bucketed by the month they were issued.
  const newInPeriod = products.filter((p) => p.importDate >= f.from && p.importDate <= f.to).length;
  const monthly: MonthPoint[] = monthKeys.map((key) => {
    const registered = products.filter((p) => monthKey(p.importDate) === key);
    const issued = products.filter((p) => p.status !== "pending" && monthKey(p.resultDate) === key);
    const ts = trainings.filter((t) => monthKey(t.date) === key);
    return {
      key,
      label: monthLabel(key),
      imported: registered.length,
      pass: issued.filter((p) => p.status === "pass").length,
      fail: issued.filter((p) => p.status === "fail").length,
      pending: registered.filter((p) => p.status === "pending").length,
      containers: registered.reduce((s, p) => s + p.containers, 0),
      value: registered.reduce((s, p) => s + p.value, 0),
      trainings: ts.length,
    };
  });
  const spark = (fn: (m: MonthPoint) => number) => monthly.slice(-12).map(fn);

  // KPI cards
  const passRateTrend =
    totals.passRate !== null && prevTotals.passRate !== null
      ? (totals.passRate - prevTotals.passRate) * 100
      : null;

  const kpis: Kpi[] = [
    {
      id: "products",
      label: "أصناف في التجربة المعملية",
      value: fmtInt(totals.count),
      sub: `${fmtInt(newInPeriod)} سُجّلت داخل الفترة · ${fmtInt(totals.pending)} قيد التحليل`,
      trend: trendOf(totals.count, prevTotals.count),
      trendUnit: "%",
      goodWhenUp: true,
      icon: "🧪",
      tone: "indigo",
      spark: spark((m) => m.imported),
    },
    {
      id: "containers",
      label: "العبوات قيد التجربة",
      value: fmtInt(totals.containers),
      sub: `${fmtInt(totals.liters / 1000)} ألف لتر إجمالاً`,
      trend: trendOf(totals.containers, prevTotals.containers),
      trendUnit: "%",
      goodWhenUp: true,
      icon: "📦",
      tone: "sky",
      spark: spark((m) => m.containers),
    },
    {
      id: "passrate",
      label: "نسبة المطابقة",
      value: fmtPct(totals.passRate),
      sub: `${fmtInt(totals.pass)} مطابق من ${fmtInt(totals.completed)} نتيجة صدرت`,
      trend: passRateTrend,
      trendUnit: "pp",
      goodWhenUp: true,
      icon: "✅",
      tone: "emerald",
      spark: spark((m) => m.pass),
    },
    {
      id: "pending",
      label: "قيد التحليل (سنتين معمل)",
      value: fmtInt(totals.pending),
      sub:
        totals.avgRemaining === null
          ? "لا توجد عينات قيد الاختبار"
          : `متوسط المتبقي ${fmtInt(totals.avgRemaining)} يوم`,
      trend: trendOf(totals.pending, prevTotals.pending),
      trendUnit: "%",
      goodWhenUp: null,
      icon: "⏳",
      tone: "amber",
      spark: spark((m) => m.pending),
    },
    {
      id: "trainings",
      label: "الدورات التدريبية",
      value: fmtInt(totals.trainCount),
      sub: `${fmtInt(totals.attendees)} متدرب · ${fmtInt(totals.hours)} ساعة`,
      trend: trendOf(totals.trainCount, prevTotals.trainCount),
      trendUnit: "%",
      goodWhenUp: true,
      icon: "🎓",
      tone: "violet",
      spark: spark((m) => m.trainings),
    },
    {
      id: "value",
      label: "قيمة الواردات",
      value: fmtMillions(totals.value),
      sub: "قيمة الشحنات المسجّلة للتحليل",
      trend: trendOf(totals.value, prevTotals.value),
      trendUnit: "%",
      goodWhenUp: true,
      icon: "💰",
      tone: "rose",
      spark: spark((m) => m.value),
    },
  ];

  // Donut: status distribution
  const statusData = (["pass", "fail", "pending"] as LabStatus[]).map((s) => ({
    key: s,
    name: STATUS_META[s].label,
    value: totals[s],
    color: STATUS_META[s].color,
  }));

  // Stacked bar: status per product category
  const categoryBars = CATEGORIES.filter((c) => f.segment === "all" || c === f.segment).map((c) => {
    const ps = products.filter((p) => p.category === c);
    return {
      key: c,
      name: CATEGORY_META[c].short,
      fullName: CATEGORY_META[c].label,
      pass: ps.filter((p) => p.status === "pass").length,
      fail: ps.filter((p) => p.status === "fail").length,
      pending: ps.filter((p) => p.status === "pending").length,
    };
  });

  // Stacked bar: training attendees per quarter per category
  const quarterKeys = Array.from(new Set(monthKeys.map((k) => quarterKey(`${k}-01`))));
  const trainingQuarters = quarterKeys.map((q) => {
    const ts = trainings.filter((t) => quarterKey(t.date) === q);
    const row: Record<string, string | number | null> = {
      label: quarterLabel(q),
      courses: ts.length,
      hours: ts.reduce((s, t) => s + t.hours, 0),
      rating: ts.length ? Math.round((ts.reduce((s, t) => s + t.rating, 0) / ts.length) * 10) / 10 : null,
    };
    (["insecticide", "fungicide", "herbicide", "general"] as const).forEach((c) => {
      row[c] = ts.filter((t) => t.category === c).reduce((s, t) => s + t.attendees, 0);
    });
    return row;
  });

  // Horizontal stacked bar: containers by country of origin
  const originMap = new Map<string, OriginRow>();
  products.forEach((p) => {
    const row: OriginRow =
      originMap.get(p.origin) ?? {
        name: p.origin,
        total: 0,
        insecticide: 0,
        fungicide: 0,
        herbicide: 0,
        count: 0,
        share: 0,
      };
    row[p.category] += p.containers;
    row.total += p.containers;
    row.count += 1;
    originMap.set(p.origin, row);
  });
  const origins: OriginRow[] = Array.from(originMap.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 6)
    .map((row) => ({ ...row, share: row.total / Math.max(1, totals.containers) }));

  // Insights
  const ratedCats = CATEGORIES.map((c) => {
    const ps = products.filter((p) => p.category === c);
    const pass = ps.filter((p) => p.status === "pass").length;
    const completed = ps.filter((p) => p.status !== "pending").length;
    return { c, rate: completed ? pass / completed : null, completed };
  })
    .filter((x) => x.rate !== null)
    .sort((a, b) => (b.rate as number) - (a.rate as number));

  const nextResult = products
    .filter((p) => p.status === "pending")
    .sort((a, b) => a.daysRemaining - b.daysRemaining)[0];
  const biggest = [...products].sort((a, b) => b.value - a.value)[0];
  const topOrigin = origins[0];

  const insights: Insight[] = [
    {
      id: "best-cat",
      icon: "🏆",
      title: "أعلى فئة في المطابقة",
      value: ratedCats[0] ? CATEGORY_META[ratedCats[0].c].label : "—",
      detail: ratedCats[0]
        ? `${fmtPct(ratedCats[0].rate)} من ${fmtInt(ratedCats[0].completed)} نتيجة منتهية`
        : "لا توجد نتائج منتهية في الفترة",
    },
    {
      id: "top-origin",
      icon: "🌍",
      title: "أكبر دولة منشأ",
      value: topOrigin ? String(topOrigin.name) : "—",
      detail: topOrigin
        ? `${fmtPct(topOrigin.share as number)} من إجمالي العبوات`
        : "لا توجد بيانات",
    },
    {
      id: "next-result",
      icon: "📅",
      title: "أقرب نتيجة متوقعة",
      value: nextResult ? nextResult.name : "—",
      detail: nextResult
        ? `تصدر في ${nextResult.resultDate.split("-").reverse().join("/")} (بعد ${fmtInt(nextResult.daysRemaining)} يوم)`
        : "لا توجد عينات قيد التحليل",
    },
    {
      id: "biggest",
      icon: "🚚",
      title: "أكبر شحنة بالقيمة",
      value: biggest ? biggest.name : "—",
      detail: biggest ? `${fmtMillions(biggest.value)} · ${fmtInt(biggest.containers)} عبوة` : "لا توجد بيانات",
    },
  ];

  return {
    kpis,
    totals,
    monthly,
    statusData,
    categoryBars,
    trainingQuarters,
    origins,
    insights,
    products,
    trainings,
  };
}
