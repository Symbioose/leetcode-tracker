import { getReviewDueDates, layoutRemaining, REVIEW_HORIZON } from "./spacedRepetition";
import { BASELINE_KEY, isoKey } from "../data/studyPlan";

const PROGRESS_KEY = "leetcode-progress-v2";
const LIST_NAME = "NeetCode 150";

// How many catch-up "next reviews" land on each day of the stagger.
const CAP_PER_DAY = 4;

// Bump to force the one-shot migration to re-run in every browser, even where
// an earlier run already stamped the meta (e.g. it ran on stale/empty data
// that a later Gist pull replaced).
const RESCHEDULE_VERSION = 2;

const addDaysKey = (key, days) => {
  const [y, m, d] = key.split("-").map(Number);
  return isoKey(new Date(y, m - 1, d + days));
};

// One-shot re-layout of every remaining review so the whole cycle finishes by
// REVIEW_HORIZON (end of December, after the Sept–Nov interviews):
//
// - Each problem's NEXT unchecked review: kept if already scheduled in the
//   future, else (overdue backlog) staggered from today at CAP_PER_DAY/day,
//   oldest first.
// - Every LATER unchecked slot gets an explicit date: gaps double from the
//   next review out to the horizon. This also kills the legacy fallback that
//   derived all 5 dates from solvedDate and made months-old problems show
//   four or five "overdue" reviews at once.
//
// Only reviewDueDates move — solved states, completed reviews, feelings, EF
// and gaps are untouched. Completing a review recomputes its successor via
// the (horizon-capped) SM-2 anyway; these dates are the standing schedule.
// The `rescheduledAt` flag lives in the gist-synced study-plan meta.
export const rescheduleReviews = () => {
  try {
    const metaRaw = localStorage.getItem(BASELINE_KEY);
    const meta = metaRaw ? JSON.parse(metaRaw) : {};
    if ((meta.rescheduleV || 0) >= RESCHEDULE_VERSION) return;

    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return; // no data yet (fresh browser) — leave the flag unset
    const parsed = JSON.parse(raw);
    const list = parsed[LIST_NAME];
    if (!list) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayK = isoKey(today);

    // Next actionable review per problem.
    const entries = [];
    for (const [id, prob] of Object.entries(list)) {
      if (!prob?.solved) continue;
      const dues = getReviewDueDates(prob);
      if (!dues.length) continue;
      let nextIdx = -1;
      for (let i = 0; i < 5; i++) {
        if (!prob.reviews?.[i]) { nextIdx = i; break; }
      }
      if (nextIdx === -1) continue; // all five done
      entries.push({ id, nextIdx, due: dues[nextIdx] });
    }

    // Overdue next-reviews: stagger from today, oldest first.
    const overdue = entries
      .filter((e) => e.due < todayK)
      .sort((a, b) => a.due.localeCompare(b.due));
    overdue.forEach((e, i) => {
      e.newDue = addDaysKey(todayK, Math.floor(i / CAP_PER_DAY));
    });
    // Future next-reviews: keep their date, clamped to the horizon.
    for (const e of entries) {
      if (!e.newDue) e.newDue = e.due > REVIEW_HORIZON ? REVIEW_HORIZON : e.due;
    }

    // Write the full remaining schedule per problem.
    for (const e of entries) {
      const prob = list[e.id];
      const dueDates = [...(prob.reviewDueDates || [])];
      while (dueDates.length < 5) dueDates.push(null);
      dueDates[e.nextIdx] = e.newDue;

      layoutRemaining(dueDates, prob.reviews, e.nextIdx, e.newDue);
      list[e.id] = { ...prob, reviewDueDates: dueDates };
    }

    localStorage.setItem(PROGRESS_KEY, JSON.stringify(parsed));
    localStorage.setItem(
      BASELINE_KEY,
      JSON.stringify({
        ...meta,
        rescheduleV: RESCHEDULE_VERSION,
        rescheduledAt: todayK,
        rescheduledBacklog: overdue.length,
      })
    );
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("local-data-changed"));
    }
  } catch (err) {
    console.error("Review reschedule failed:", err);
  }
};
