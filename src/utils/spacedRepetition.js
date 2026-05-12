// SM-2 inspired spaced repetition with a compounding per-problem ease factor.
//
// - Each problem stores `easeFactor` (init 2.5) and `gaps[]` (days between
//   each review trigger). The next review's gap is computed by compounding
//   the previous gap with the updated ease factor, so a problem you keep
//   acing stretches out further and further over time, while a struggling
//   one shrinks back toward "see it again soon".
// - Feelings: easy → EF +0.15, medium → 0, hard → EF -0.20, clamped to [1.3, 3.0].
// - Seed gaps: R1 fires 1 day after solve, R2 fires 6 days after R1
//   (these are fixed, regardless of feeling — same as Anki/SM-2).
// - From R3 onward: nextGap = round(prevGap * newEF). Hard additionally
//   halves the resulting gap so you see the problem again sooner.

export const EF_INIT = 2.5;
export const EF_MIN = 1.3;
export const EF_MAX = 3.0;

const FEELING_DELTA = { easy: 0.15, medium: 0, hard: -0.20 };

// Seed gaps used before compounding kicks in.
// SEED_GAPS[i] = days between completing review i-1 (or solving for i=0) and review i firing.
const SEED_GAPS = [1, 6];

// Legacy fallback: used to estimate prevGap on data created before gaps[] existed.
export const BASE_INTERVALS = [1, 3, 7, 14, 30];
const LEGACY_GAPS = [1, 2, 4, 7, 16];

const clampEF = (ef) => Math.max(EF_MIN, Math.min(EF_MAX, ef));

const updateEaseFactor = (current, feeling) =>
  clampEF((Number.isFinite(current) ? current : EF_INIT) + (FEELING_DELTA[feeling] ?? 0));

const addDays = (dateStr, days) => {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d + days);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
};

// Initial gaps for a freshly-solved problem: R1 fires 1 day later.
export const initialGaps = () => {
  const arr = Array(5).fill(null);
  arr[0] = SEED_GAPS[0];
  return arr;
};

// Resolve the gap of review `idx`, falling back to legacy/seed when missing.
const gapOf = (prob, idx) => {
  const stored = prob?.gaps?.[idx];
  if (Number.isFinite(stored) && stored > 0) return stored;
  if (idx < SEED_GAPS.length) return SEED_GAPS[idx];
  return LEGACY_GAPS[idx] ?? SEED_GAPS[SEED_GAPS.length - 1];
};

// Returns the 5 review due dates for a problem, using stored adaptive dates
// when available and falling back to a base schedule from `solvedDate` otherwise.
export const getReviewDueDates = (prob) => {
  if (!prob?.solvedDate) return [];
  return BASE_INTERVALS.map((days, i) =>
    prob.reviewDueDates?.[i] ?? addDays(prob.solvedDate, days)
  );
};

// Compute the schedule update produced by completing review `reviewIndex`
// with `feeling` on `completionDate`. Returns the next review's due date,
// the gap used (so we can compound from it next time), and the new EF.
//
// When reviewIndex is the last review (4), `dueDate` and `gap` are null but
// the EF still updates to reflect the latest rating.
export const computeNextSchedule = (completionDate, reviewIndex, feeling, prob) => {
  const prevEF = prob?.easeFactor ?? EF_INIT;
  const newEF = updateEaseFactor(prevEF, feeling);
  const nextIndex = reviewIndex + 1;

  if (nextIndex >= 5) return { dueDate: null, gap: null, easeFactor: newEF };

  let gap;
  if (nextIndex < SEED_GAPS.length) {
    // Seed phase: gap is fixed regardless of feeling.
    gap = SEED_GAPS[nextIndex];
  } else {
    const prevGap = gapOf(prob, reviewIndex);
    gap = Math.max(1, Math.round(prevGap * newEF));
  }

  // Hard: in addition to dropping EF, shrink the next gap so the problem
  // surfaces again soon. Only meaningful past the seed phase.
  if (feeling === "hard" && nextIndex >= SEED_GAPS.length) {
    gap = Math.max(1, Math.round(gap * 0.5));
  }

  return {
    dueDate: addDays(completionDate, gap),
    gap,
    easeFactor: newEF,
  };
};

// Back-compat shim: existing callers using the old (date, idx, feeling) signature.
export const computeNextDueDate = (completionDate, reviewIndex, feeling) =>
  computeNextSchedule(completionDate, reviewIndex, feeling, null).dueDate;
