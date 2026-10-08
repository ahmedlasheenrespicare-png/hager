import { useCallback, useMemo, useState } from "react";
import { ThemeProvider } from "./context/ThemeContext";
import Header from "./components/Header";
import FilterBar from "./components/FilterBar";
import KpiCard from "./components/KpiCard";
import Panel from "./components/Panel";
import InsightsPanel from "./components/InsightsPanel";
import ProductsTable from "./components/ProductsTable";
import { CategoryBarChart, OriginBarChart, StatusDonut, TrainingBarChart, TrendLineChart } from "./components/Charts";
import { buildDashboard, presetRange } from "./lib/analytics";
import { PRODUCTS, TRAININGS } from "./lib/generateData";
import { DATA_START, TODAY } from "./lib/dates";
import type { Filters, RangePreset, Segment } from "./lib/types";

const INITIAL_FILTERS: Filters = {
  ...presetRange("12m"),
  segment: "all",
  preset: "12m",
};

function DashboardView() {
  const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS);

  // Single source of truth: every KPI, chart and table is derived from these filters.
  const data = useMemo(() => buildDashboard(filters, PRODUCTS, TRAININGS), [filters]);

  const applyPreset = useCallback((preset: Exclude<RangePreset, "custom">) => {
    setFilters((f) => ({ ...f, ...presetRange(preset), preset }));
  }, []);

  const changeDate = useCallback((field: "from" | "to", value: string) => {
    if (!value) return;
    setFilters((f) => {
      let from = field === "from" ? value : f.from;
      let to = field === "to" ? value : f.to;
      // Keep the range valid: if the user picks an inverted range, move the other bound.
      if (from > to) {
        if (field === "from") to = from;
        else from = to;
      }
      return { ...f, from, to, preset: "custom" };
    });
  }, []);

  const setSegment = useCallback((segment: Segment) => {
    setFilters((f) => ({ ...f, segment }));
  }, []);

  const reset = useCallback(() => setFilters(INITIAL_FILTERS), []);

  return (
    <div className="relative min-h-screen bg-slate-50 transition-colors duration-500 dark:bg-slate-950">
      {/* Decorative ambient gradient */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-gradient-to-b from-indigo-500/10 via-violet-500/5 to-transparent dark:from-indigo-500/15 dark:via-violet-500/5" />

      <main className="relative mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <Header />

        <FilterBar
          filters={filters}
          resultCount={data.totals.count}
          minDate={DATA_START}
          maxDate={TODAY}
          onPreset={applyPreset}
          onDateChange={changeDate}
          onSegment={setSegment}
          onReset={reset}
        />

        {/* KPI summary cards */}
        <section aria-label="مؤشرات الأداء الرئيسية" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data.kpis.map((kpi, i) => (
            <KpiCard key={kpi.id} kpi={kpi} index={i} />
          ))}
        </section>

        {/* Trend + distribution */}
        <div className="grid gap-6 xl:grid-cols-3">
          <Panel
            className="xl:col-span-2"
            title="تطور الأصناف والنتائج شهرياً"
            subtitle="الأصناف المسجّلة حسب شهر الاستيراد، والنتائج المطابقة وغير المطابقة حسب شهر صدورها"
            delay={100}
          >
            <TrendLineChart data={data.monthly} />
          </Panel>

          <Panel title="حالة التحليل" subtitle="توزيع الأصناف التي كانت في التجربة خلال الفترة حسب النتيجة" delay={150}>
            <StatusDonut data={data.statusData} total={data.totals.count} />
          </Panel>
        </div>

        {/* Category + training */}
        <div className="grid gap-6 xl:grid-cols-3">
          <Panel title="الحالة حسب نوع المبيد" subtitle="مقارنة نتائج المطابقة بين الحشري والفطري والحشائش" delay={200}>
            <CategoryBarChart data={data.categoryBars} />
          </Panel>

          <Panel
            className="xl:col-span-2"
            title="الدورات التدريبية حسب الربع"
            subtitle="عدد المتدربين موزعين حسب نوع الدورة، مع الساعات والتقييم عند التمرير"
            delay={250}
          >
            <TrainingBarChart data={data.trainingQuarters} segment={filters.segment} />
          </Panel>
        </div>

        {/* Origin + insights */}
        <div className="grid gap-6 xl:grid-cols-3">
          <Panel
            className="xl:col-span-2"
            title="الواردات حسب دولة المنشأ"
            subtitle="عدد العبوات لأعلى 6 دول منشأ، مقسّمة حسب نوع المبيد"
            delay={300}
          >
            <OriginBarChart data={data.origins} segment={filters.segment} />
          </Panel>

          <Panel title="رؤى سريعة" subtitle="ملخص تلقائي يتحدث مع الفلاتر" delay={350}>
            <InsightsPanel insights={data.insights} />
          </Panel>
        </div>

        {/* Detailed table */}
        <ProductsTable products={data.products} />

        <footer className="pb-4 text-center text-xs text-slate-400 dark:text-slate-600">
          * البيانات المعروضة تجريبية (Sample Data) لأغراض العرض التوضيحي · مدة التجربة المعملية 730 يوماً لكل صنف
        </footer>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <DashboardView />
    </ThemeProvider>
  );
}
