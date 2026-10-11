// Single source of truth for the re-targeted study plan.
// Re-planned July 15, 2026 → finish everything by October 31, 2026.
// Two phases: everything before the final rush (now history), then the rush
// itself. The Thailand trip is over, so it's folded into the pre-rush phase
// instead of standing on its own.
// Adjust perDay / dates here; StudyPlan and the 75 Hard tracker both read this.

export const PLAN_START = "2026-07-15";
export const PLAN_TARGET = "2026-10-31";

// localStorage key holding { date, solved } — snapshot of progress when the
// re-plan went live, used to compute ahead/behind honestly.
export const BASELINE_KEY = "study-plan-v2";

export const PLAN_PHASES = [
  {
    id: "preflight",
    name: "Pré-départ",
    start: "2026-07-15",
    end: "2026-08-24",
    // Blended rate: 9j @3/jour avant le départ + 32j @2/jour en Thaïlande,
    // gardé égal à la somme d'origine pour ne pas fausser le calcul
    // d'avance/retard rétroactivement.
    perDay: 91 / 41,
    hoursLabel: "2-3h / jour (moy.)",
    note: "Pré-départ + Thaïlande — terminé",
  },
  {
    id: "rush",
    name: "Rush final",
    start: "2026-08-25",
    end: "2026-10-31",
    perDay: 4,
    hoursLabel: "4-5h / jour",
    note: "Sprint jusqu'à fin octobre",
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
