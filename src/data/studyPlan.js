// Single source of truth for the re-targeted study plan.
// Re-planned July 15, 2026 → finish everything by September 30, 2026.
// Three phases with different daily capacity (Thailand trip = max 2h/day).
// Adjust perDay / dates here; StudyPlan and the 75 Hard tracker both read this.

export const PLAN_START = "2026-07-15";
export const PLAN_TARGET = "2026-09-30";

// localStorage key holding { date, solved } — snapshot of progress when the
// re-plan went live, used to compute ahead/behind honestly.
export const BASELINE_KEY = "study-plan-v2";

export const PLAN_PHASES = [
  {
    id: "preflight",
    name: "Pré-départ",
    start: "2026-07-15",
    end: "2026-07-23",
    perDay: 3,
    hoursLabel: "3-4h / jour",
    note: "À fond avant le départ",
  },
  {
    id: "thailand",
    name: "Thaïlande",
    start: "2026-07-24",
    end: "2026-08-24",
    perDay: 2,
    hoursLabel: "2h / jour max",
    note: "NeetCode + lecture uniquement",
  },
  {
    id: "rush",
    name: "Rush final",
    start: "2026-08-25",
    end: "2026-09-30",
    perDay: 4,
    hoursLabel: "4-5h / jour",
    note: "Sprint jusqu'à fin septembre",
  },
];

export const parseISO = (iso) => new Date(`${iso}T00:00:00`);

export const isoKey = (d) =>
  [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");

export const phaseForKey = (key) =>
  PLAN_PHASES.find((p) => key >= p.start && key <= p.end) || null;

// Sum of nominal per-day capacity over all plan days in [fromKey, toKey] inclusive.
// Days outside every phase contribute 0.
export const capacityBetween = (fromKey, toKey) => {
  if (!fromKey || !toKey || fromKey > toKey) return 0;
  let total = 0;
  const cursor = parseISO(fromKey);
  const end = parseISO(toKey);
  while (cursor <= end) {
    const phase = phaseForKey(isoKey(cursor));
    if (phase) total += phase.perDay;
    cursor.setDate(cursor.getDate() + 1);
  }
  return total;
};
