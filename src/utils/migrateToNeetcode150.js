import { blind75, leetcode75, neetcode150 } from "../data";

const PROGRESS_KEY = "leetcode-progress-v2";

const score = (entry) => {
  if (!entry) return -1;
  const reviews = (entry.reviews || []).filter(Boolean).length;
  const dates = entry.dates ? Object.keys(entry.dates).length : 0;
  return (entry.solved ? 1000 : 0) + reviews * 10 + dates;
};

const mergeBest = (raw) => {
  const blind = raw["Blind 75"] || {};
  const lc75 = raw["LeetCode 75"] || {};
  const neet = { ...(raw["NeetCode 150"] || {}) };

  const blindBySlug = Object.fromEntries(blind75.map((p) => [p.slug, p.id]));
  const lc75BySlug = Object.fromEntries(leetcode75.map((p) => [p.slug, p.id]));

  neetcode150.forEach((p) => {
    const blindEntry = blindBySlug[p.slug] ? blind[blindBySlug[p.slug]] : null;
    const lcEntry = lc75BySlug[p.slug] ? lc75[lc75BySlug[p.slug]] : null;
    const current = neet[p.id];
    const best = [current, blindEntry, lcEntry].reduce(
      (b, c) => (score(c) > score(b) ? c : b),
      null
    );
    if (best && best !== current) neet[p.id] = best;
  });

  return { "NeetCode 150": neet };
};

// Idempotent: only writes when old keys exist in localStorage.
export const migrateToNeetcode150 = () => {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (!parsed["Blind 75"] && !parsed["LeetCode 75"]) return;
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(mergeBest(parsed)));
  } catch (err) {
    console.error("Blind75 → NeetCode150 migration failed:", err);
  }
};

// Same logic for in-memory state (used after a Gist pull).
export const reshapeProgress = (progress) => {
  if (!progress) return progress;
  if (!progress["Blind 75"] && !progress["LeetCode 75"]) return progress;
  return mergeBest(progress);
};
