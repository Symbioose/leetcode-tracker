// Base intervals from solved date (days)
export const BASE_INTERVALS = [1, 3, 7, 14, 30];

// Gap between consecutive reviews for adaptive scheduling
const BASE_GAPS = [1, 2, 4, 7, 16];

const FEELING_FACTOR = { easy: 2.0, medium: 1.0, hard: 0.5 };

const addDays = (dateStr, days) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d + days);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
};

// Returns the 5 review due dates for a problem, using adaptive stored dates when available.
export const getReviewDueDates = (prob) => {
  if (!prob?.solvedDate) return [];
  return BASE_INTERVALS.map((days, i) =>
    prob.reviewDueDates?.[i] ?? addDays(prob.solvedDate, days)
  );
};

// Returns the due date for the next review after completing reviewIndex with a feeling.
// Returns null if there is no next review.
export const computeNextDueDate = (completionDate, reviewIndex, feeling) => {
  const nextIndex = reviewIndex + 1;
  if (nextIndex >= 5) return null;
  const factor = FEELING_FACTOR[feeling] ?? 1.0;
  const gap = Math.max(1, Math.round(BASE_GAPS[nextIndex] * factor));
  return addDays(completionDate, gap);
};
