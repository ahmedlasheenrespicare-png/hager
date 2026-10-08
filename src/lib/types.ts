export type Category = "insecticide" | "fungicide" | "herbicide";
export type TrainingCategory = Category | "general";
export type LabStatus = "pass" | "fail" | "pending";

export interface ProductRecord {
  code: string;
  name: string;
  category: Category;
  origin: string;
  importDate: string; // YYYY-MM-DD
  labStart: string; // YYYY-MM-DD
  resultDate: string; // expected / actual result date
  containers: number; // عدد العبوات
  packSize: number; // لتر لكل عبوة
  unitCost: number; // ج.م لكل لتر
  value: number; // ج.م
  status: LabStatus;
  progress: number; // 0..1
  daysRemaining: number;
}

export interface TrainingRecord {
  id: string;
  title: string;
  category: TrainingCategory;
  date: string;
  attendees: number;
  hours: number;
  rating: number;
}

export type Segment = "all" | Category;
export type RangePreset = "6m" | "12m" | "24m" | "all" | "custom";

export interface Filters {
  from: string;
  to: string;
  segment: Segment;
  preset: RangePreset;
}

export const CATEGORY_META: Record<
  Category,
  { label: string; short: string; emoji: string; color: string }
> = {
  insecticide: { label: "مبيدات حشرية", short: "حشري", emoji: "🐛", color: "#8b5cf6" },
  fungicide: { label: "مبيدات فطرية", short: "فطري", emoji: "🍄", color: "#0ea5e9" },
  herbicide: { label: "مبيدات حشائش", short: "حشائش", emoji: "🌿", color: "#84cc16" },
};

export const TRAINING_META: Record<TrainingCategory, { label: string; color: string }> = {
  insecticide: { label: "حشري", color: "#8b5cf6" },
  fungicide: { label: "فطري", color: "#0ea5e9" },
  herbicide: { label: "حشائش", color: "#84cc16" },
  general: { label: "عام", color: "#6366f1" },
};

export const STATUS_META: Record<LabStatus, { label: string; color: string; soft: string }> = {
  pass: { label: "مطابق", color: "#10b981", soft: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" },
  fail: { label: "غير مطابق", color: "#f43f5e", soft: "bg-rose-500/15 text-rose-600 dark:text-rose-400" },
  pending: { label: "قيد التحليل", color: "#f59e0b", soft: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
};
