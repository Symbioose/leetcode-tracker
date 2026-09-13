import { useState, useEffect, useRef, useCallback, useMemo } from "react";

const STORAGE_KEY = "daily-challenge-v1";

// Task lists per plan phase. Each history day is judged against the list that
// was active on that date, so past streaks and completed days stay intact.

// Original list — everything before the Thailand departure.
const TASKS_LEGACY = [
  { id: "leetcode", label: "LeetCode", target: "2 problèmes Medium", emoji: "🧠", countable: true, targetCount: 2 },
  { id: "ml",       label: "ML / System Design", target: "45 min (alterner)", emoji: "📐" },
  { id: "sport",    label: "Sport",              target: "Séance complète",   emoji: "💪" },
  { id: "nback",    label: "Dual n-back",        target: "20 min",            emoji: "🧩" },
  { id: "pitch",    label: "Pitch anglais",      target: "15 min PREP",       emoji: "🎤" },
  { id: "rubiks",   label: "Rubik's cube",       target: "10 min",            emoji: "🟥" },
  { id: "reading",  label: "Lecture Zero to One", target: "20 min",           emoji: "📖" },
];

// Thailand (Jul 24 → Aug 24): 2h/day max — NeetCode + reading only.
const TASKS_THAILAND = [
  { id: "leetcode", label: "LeetCode", target: "2 problèmes", emoji: "🧠", countable: true, targetCount: 2 },
  { id: "reviews",  label: "Révisions SM-2", target: "Toutes les révisions dues", emoji: "🔁" },
  { id: "reading",  label: "Lecture", target: "20 min", emoji: "📖" },
];

// Final rush (Aug 25 → interviews): full interview-prep days.
const TASKS_RUSH = [
  { id: "leetcode", label: "LeetCode", target: "4 problèmes", emoji: "🧠", countable: true, targetCount: 4 },
  { id: "reviews",  label: "Révisions SM-2", target: "Toutes les révisions dues", emoji: "🔁" },
  { id: "ml",       label: "ML / System Design", target: "45 min (alterner)", emoji: "📐" },
  { id: "pitch",    label: "Pitch anglais / Mock", target: "30 min", emoji: "🎤" },
  { id: "sport",    label: "Sport", target: "Séance complète", emoji: "💪" },
];

// Frozen historical boundary — the Thailand phase no longer exists as a plan
// phase (trip is over), but past days must keep being judged by the task
// list that was live on them, or old streaks would break retroactively.
const THAILAND_START = "2026-07-24";
const THAILAND_END = "2026-08-24";

export const tasksForDate = (key) => {
  if (key < THAILAND_START) return TASKS_LEGACY;
  if (key <= THAILAND_END) return TASKS_THAILAND;
  return TASKS_RUSH;
};

const pad = (n) => String(n).padStart(2, "0");
export const dateKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const todayKey = () => dateKey(new Date());

const blankTaskState = (task) => ({
  done: false,
  time: 0,
  runningSince: null,
  count: task.countable ? 0 : null,
});

const blankDay = (key) => ({
  tasks: Object.fromEntries(tasksForDate(key).map((t) => [t.id, blankTaskState(t)])),
});

const ensureDay = (day, key) => {
  const base = blankDay(key);
  if (!day) return base;
  return {
    ...base,
    ...day,
    tasks: {
      ...base.tasks,
      ...(day.tasks || {}),
    },
  };
};

export const isDayComplete = (day, key) => {
  if (!day?.tasks) return false;
  return tasksForDate(key).every((t) => day.tasks[t.id]?.done);
};

const completedCount = (day, key) => {
  if (!day?.tasks) return 0;
  return tasksForDate(key).reduce((acc, t) => acc + (day.tasks[t.id]?.done ? 1 : 0), 0);
};

const computeStreaks = (history) => {
  // longest = scan all days in order; gaps reset run
  const days = Object.keys(history).sort();
  let longest = 0;
  let run = 0;
  let prev = null;
  for (const k of days) {
    const complete = isDayComplete(history[k], k);
    if (!complete) {
      run = 0;
      prev = k;
      continue;
    }
    if (prev) {
      const gap = Math.round(
        (new Date(`${k}T00:00:00`) - new Date(`${prev}T00:00:00`)) / 86_400_000
      );
      run = gap === 1 ? run + 1 : 1;
    } else {
      run = 1;
    }
    if (run > longest) longest = run;
    prev = k;
  }

  // current = walk back from today; today partial is allowed (streak counts up to yesterday)
  let current = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  const todayK = dateKey(cursor);
  if (isDayComplete(history[todayK], todayK)) current += 1;
  cursor.setDate(cursor.getDate() - 1);
  while (true) {
    const k = dateKey(cursor);
    if (isDayComplete(history[k], k)) {
      current += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }

  return { current, longest };
};

const loadInitial = () => {
  const today = todayKey();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    const history = parsed?.history || {};
    if (!history[today]) history[today] = blankDay(today);
    else history[today] = ensureDay(history[today], today);
    return { history };
  } catch {
    return { history: { [today]: blankDay(today) } };
  }
};

export const useDailyChallenge = () => {
  const [state, setState] = useState(loadInitial);
  const [now, setNow] = useState(Date.now());

  // Persist + notify the Gist sync hook so it can debounce a push.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      window.dispatchEvent(new Event('local-data-changed'));
    } catch { /* ignore */ }
  }, [state]);

  // Tick once a second so live timers re-render. Cheap — page is typically open one tab.
  const lastDayRef = useRef(todayKey());
  useEffect(() => {
    const id = setInterval(() => {
      setNow(Date.now());
      const t = todayKey();
      if (t !== lastDayRef.current) {
        // Day rolled over → freeze any running timer into yesterday's `time`, init today.
        const prevDay = lastDayRef.current;
        lastDayRef.current = t;
        setState((prev) => {
          const history = { ...prev.history };
          const yesterday = ensureDay(history[prevDay], prevDay);
          const frozenTasks = { ...yesterday.tasks };
          for (const [taskId, ts] of Object.entries(frozenTasks)) {
            if (ts?.runningSince) {
              const elapsed = Math.floor((Date.now() - ts.runningSince) / 1000);
              frozenTasks[taskId] = { ...ts, time: (ts.time || 0) + elapsed, runningSince: null };
            }
          }
          history[prevDay] = { ...yesterday, tasks: frozenTasks };
          if (!history[t]) history[t] = blankDay(t);
          return { ...prev, history };
        });
      }
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const today = todayKey();
  const todayTasks = useMemo(() => tasksForDate(today), [today]);
  const todayDay = useMemo(() => ensureDay(state.history[today], today), [state.history, today]);

  const updateTask = useCallback((taskId, updater) => {
    setState((prev) => {
      const day = ensureDay(prev.history[today], today);
      const current = day.tasks[taskId];
      const next = updater(current);
      return {
        ...prev,
        history: {
          ...prev.history,
          [today]: { ...day, tasks: { ...day.tasks, [taskId]: next } },
        },
      };
    });
  }, [today]);

  const toggleDone = useCallback((taskId) => {
    updateTask(taskId, (t) => {
      const willBeDone = !t.done;
      // If completing while timer running, freeze it.
      if (willBeDone && t.runningSince) {
        const elapsed = Math.floor((Date.now() - t.runningSince) / 1000);
        return { ...t, done: true, time: (t.time || 0) + elapsed, runningSince: null };
      }
      return { ...t, done: willBeDone };
    });
  }, [updateTask]);

  const startTimer = useCallback((taskId) => {
    updateTask(taskId, (t) => (t.runningSince ? t : { ...t, runningSince: Date.now() }));
  }, [updateTask]);

  const stopTimer = useCallback((taskId) => {
    updateTask(taskId, (t) => {
      if (!t.runningSince) return t;
      const elapsed = Math.floor((Date.now() - t.runningSince) / 1000);
      return { ...t, time: (t.time || 0) + elapsed, runningSince: null };
    });
  }, [updateTask]);

  const resetTimer = useCallback((taskId) => {
    updateTask(taskId, (t) => ({ ...t, time: 0, runningSince: null }));
  }, [updateTask]);

  const setCount = useCallback((taskId, count) => {
    updateTask(taskId, (t) => {
      const safe = Math.max(0, Math.min(99, Number.isFinite(count) ? count : 0));
      const task = tasksForDate(today).find((x) => x.id === taskId);
      // auto-mark done when target reached
      const autoDone = task?.countable && task.targetCount && safe >= task.targetCount;
      return { ...t, count: safe, done: autoDone ? true : t.done };
    });
  }, [updateTask, today]);

  const liveTime = useCallback((taskState) => {
    if (!taskState) return 0;
    if (!taskState.runningSince) return taskState.time || 0;
    return (taskState.time || 0) + Math.floor((now - taskState.runningSince) / 1000);
  }, [now]);

  const streaks = useMemo(() => computeStreaks(state.history), [state.history]);
  const todayCompleted = completedCount(todayDay, today);

  return {
    today,
    todayDay,
    todayTasks,
    todayCompleted,
    totalTasks: todayTasks.length,
    history: state.history,
    streaks,
    toggleDone,
    startTimer,
    stopTimer,
    resetTimer,
    setCount,
    liveTime,
    isDayComplete,
  };
};
