// All dates are handled as ISO strings (YYYY-MM-DD) in UTC to avoid timezone drift.
export const MONTHS_AR = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
];

export const DAY_MS = 86_400_000;

export const toISO = (d: Date) => d.toISOString().slice(0, 10);

export const addDays = (iso: string, n: number) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return toISO(d);
};

/** Number of days from a to b (b - a). */
export const diffDays = (a: string, b: string) =>
  Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / DAY_MS);

export const fmtDate = (iso: string) => {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

export const monthKey = (iso: string) => iso.slice(0, 7); // YYYY-MM

export const monthLabel = (key: string) => {
  const [y, m] = key.split("-").map(Number);
  return `${MONTHS_AR[m - 1]} ${String(y).slice(2)}`;
};

export const quarterKey = (iso: string) => {
  const [y, m] = iso.split("-").map(Number);
  return `${y}-Q${Math.ceil(m / 3)}`;
};

export const quarterLabel = (key: string) => {
  const [y, q] = key.split("-Q");
  return `Q${q} ${y}`;
};

/** Reference "today" used for the whole dashboard (lab status is computed against it). */
export const TODAY = toISO(new Date());

/** First day of the earliest month we generated data for (≈ 40 months of history). */
export const DATA_START = (() => {
  const now = new Date();
  return toISO(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 39, 1)));
})();
