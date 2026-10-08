import type { Category, LabStatus, ProductRecord, TrainingCategory, TrainingRecord } from "./types";
import { addDays, DATA_START, diffDays, TODAY, toISO } from "./dates";

/** Deterministic PRNG (mulberry32) so the sample data is stable across reloads. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const LAB_DAYS = 730; // سنتين في المعامل

const NAMES: Record<Category, string[]> = {
  insecticide: [
    "سيبرو-ماكس",
    "أكتيفاكس",
    "ديلتا-شيلد",
    "نيو-فوس",
    "ألفا-تراب",
    "بيرمو-كيل",
    "ستارلينك",
    "فينوكس-برو",
    "ثيو-شيلد",
    "كلورو-زون",
    "إيمي-فلو",
    "ريدي-كيل",
  ],
  fungicide: [
    "أزوكسي-جارد",
    "تيبو-فيكس",
    "كوبر-ماكس",
    "بروبي-سيف",
    "فلوكس-برو",
    "مانكو-ستار",
    "ترايفلو",
    "سيمبيوز",
    "أوكسي-شيلد",
    "ديفيند-زد",
  ],
  herbicide: [
    "جلايفو-فاست",
    "بيكسو-كلين",
    "تريفو-جولد",
    "أمبريو-إكس",
    "ساندرو-ماكس",
    "كوينو-زون",
    "بروموكس",
    "فلورو-سيف",
    "نيكو-كيل",
    "أتلاس-برو",
  ],
};

const ORIGINS: Record<Category, string[]> = {
  insecticide: ["الصين", "الهند", "تركيا", "الصين", "الهند"],
  fungicide: ["الهند", "إيطاليا", "الصين", "ألمانيا"],
  herbicide: ["الصين", "إسبانيا", "الهند", "كوريا الجنوبية"],
};

// Probability that a completed 2-year test passes (مطابق)
const PASS_RATE: Record<Category, number> = {
  insecticide: 0.82,
  fungicide: 0.87,
  herbicide: 0.78,
};

const CODE_PREFIX: Record<Category, string> = { insecticide: "INS", fungicide: "FNG", herbicide: "HRB" };

const TRAIN_TITLES: Record<TrainingCategory, string[]> = {
  insecticide: [
    "أساسيات التطبيق الآمن للمبيدات الحشرية",
    "إدارة مقاومة الحشرات والتناوب الكيميائي",
    "تخزين ونقل المبيدات الحشرية وفق المعايير",
  ],
  fungicide: ["تشخيص أمراض الفطريات في المحاصيل", "برامج المكافحة المتكاملة للفطريات"],
  herbicide: ["الرش الموجه لمبيدات الحشائش", "إدارة الحشائش المقاومة للمبيدات"],
  general: [
    "متطلبات التسجيل والتحليل المعملي للمبيدات",
    "السلامة والصحة المهنية للعاملين بالمصنع",
    "مهارات إدارة الجودة والامتثال للوائح",
  ],
};

export function generateData(seed = 20240601) {
  const rng = mulberry32(seed);
  const between = (a: number, b: number) => a + rng() * (b - a);
  const int = (a: number, b: number) => Math.floor(between(a, b + 1));
  const pick = <T,>(arr: T[]): T => arr[Math.floor(rng() * arr.length)];
  const weighted = <T,>(items: [T, number][]): T => {
    const total = items.reduce((s, [, w]) => s + w, 0);
    let r = rng() * total;
    for (const [item, w] of items) {
      r -= w;
      if (r <= 0) return item;
    }
    return items[items.length - 1][0];
  };

  const now = new Date();
  const curY = now.getUTCFullYear();
  const curM = now.getUTCMonth();
  const MONTHS_BACK = 39;

  const products: ProductRecord[] = [];
  const trainings: TrainingRecord[] = [];
  let productSeq = 0;
  let trainingSeq = 0;

  for (let back = MONTHS_BACK; back >= 0; back--) {
    const monthStart = new Date(Date.UTC(curY, curM - back, 1));
    const y = monthStart.getUTCFullYear();
    const m = monthStart.getUTCMonth();
    const daysInMonth = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();

    // ---------- Product registrations (shipments entering lab testing) ----------
    const shipments = int(1, 3) + (back < 16 ? 1 : 0); // volume grows in recent months
    for (let s = 0; s < shipments; s++) {
      const importDate = toISO(new Date(Date.UTC(y, m, int(1, daysInMonth))));
      if (importDate > TODAY) continue;

      productSeq++;
      const category = weighted<Category>([
        ["insecticide", 0.42],
        ["fungicide", 0.3],
        ["herbicide", 0.28],
      ]);
      const base = pick(NAMES[category]);
      const conc = pick(["20%", "25%", "35%", "48%", "50%", "72%"]);
      const form = pick(["EC", "SC", "WP", "SL", "WG", "EW"]);
      const labStart = addDays(importDate, int(5, 35));
      const resultDate = addDays(labStart, LAB_DAYS);

      let status: LabStatus = "pending";
      if (resultDate <= TODAY) status = rng() < PASS_RATE[category] ? "pass" : "fail";

      const packSize = weighted<number>([
        [1, 0.2],
        [5, 0.35],
        [10, 0.25],
        [20, 0.2],
      ]);
      const containers = Math.round(between(120, 2400) / 10) * 10;
      const unitCost = Math.round(between(90, 320));
      const elapsed = diffDays(labStart, TODAY);

      products.push({
        code: `${CODE_PREFIX[category]}-${String(curY % 100)}${String(productSeq).padStart(3, "0")}`,
        name: `${base} ${conc} ${form}`,
        category,
        origin: pick(ORIGINS[category]),
        importDate,
        labStart,
        resultDate,
        containers,
        packSize,
        unitCost,
        value: containers * packSize * unitCost,
        status,
        progress: Math.min(1, Math.max(0, Math.round((elapsed / LAB_DAYS) * 1000) / 1000)),
        daysRemaining: Math.max(0, diffDays(TODAY, resultDate)),
      });
    }

    // ---------- Training courses ----------
    const courses = (rng() < 0.6 ? 1 : 0) + (rng() < 0.4 ? 1 : 0);
    for (let c = 0; c < courses; c++) {
      const category = weighted<TrainingCategory>([
        ["general", 0.2],
        ["insecticide", 0.3],
        ["fungicide", 0.25],
        ["herbicide", 0.25],
      ]);
      const date = toISO(new Date(Date.UTC(y, m, int(1, daysInMonth))));
      if (date > TODAY) continue;
      trainingSeq++;
      trainings.push({
        id: `TR-${String(trainingSeq).padStart(3, "0")}`,
        title: pick(TRAIN_TITLES[category]),
        category,
        date,
        attendees: int(12, 40),
        hours: pick([4, 8, 12, 16]),
        rating: Math.round(between(3.6, 5) * 10) / 10,
      });
    }
  }

  return { products, trainings };
}

const generated = generateData();

export const PRODUCTS: ProductRecord[] = generated.products;
export const TRAININGS: TrainingRecord[] = generated.trainings;

export { DATA_START, TODAY };
