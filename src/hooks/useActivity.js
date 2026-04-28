import { useState, useCallback } from 'react';

const STORAGE_KEY = 'activity-log';

const dateStr = (d) => [
  d.getFullYear(),
  String(d.getMonth() + 1).padStart(2, '0'),
  String(d.getDate()).padStart(2, '0'),
].join('-');

const todayStr = () => dateStr(new Date());

const computeStreaks = (activity) => {
  const dates = Object.keys(activity).sort();

  // Longest streak
  let longest = dates.length > 0 ? 1 : 0;
  let temp = 1;
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1] + 'T00:00:00');
    const curr = new Date(dates[i] + 'T00:00:00');
    const diff = Math.round((curr - prev) / 86400000);
    if (diff === 1) {
      temp++;
      if (temp > longest) longest = temp;
    } else {
      temp = 1;
    }
  }

  // Current streak going backwards from today
  let current = 0;
  const d = new Date();
  // Allow today to have no activity yet (don't break streak if user hasn't done anything today)
  let skipToday = !activity[todayStr()];

  while (true) {
    const s = dateStr(d);
    if (activity[s]) {
      current++;
      d.setDate(d.getDate() - 1);
    } else if (skipToday) {
      skipToday = false;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }

  return { current, longest };
};

export const useActivity = () => {
  const [activity, setActivity] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const recordActivity = useCallback(() => {
    const today = todayStr();
    setActivity((prev) => {
      const updated = { ...prev, [today]: (prev[today] ?? 0) + 1 };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch { }
      return updated;
    });
  }, []);

  return { activity, recordActivity, streaks: computeStreaks(activity) };
};
