import { useState, useEffect, useRef, useCallback, useMemo } from "react";

const STORAGE_KEY = "daily-challenge-v1";

export const TASKS = [
  { id: "leetcode", label: "LeetCode", target: "2 problèmes Medium", emoji: "🧠", countable: true, targetCount: 2 },
  { id: "ml",       label: "ML / System Design", target: "45 min (alterner)", emoji: "📐" },
  { id: "sport",    label: "Sport",              target: "Séance complète",   emoji: "💪" },
  { id: "nback",    label: "Dual n-back",        target: "20 min",            emoji: "🧩" },
  { id: "pitch",    label: "Pitch anglais",      target: "15 min PREP",       emoji: "🎤" },
  { id: "rubiks",   label: "Rubik's cube",       target: "10 min",            emoji: "🟥" },
  { id: "reading",  label: "Lecture Zero to One", target: "20 min",           emoji: "📖" },
];

export const TASK_COUNT = TASKS.length;

const pad = (n) => String(n).padStart(2, "0");
export const dateKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const todayKey = () => dateKey(new Date());

const blankTaskState = (task) => ({
  done: false,
  time: 0,
  runningSince: null,
  count: task.countable ? 0 : null,
});

const blankDay = () => ({
  tasks: Object.fromEntries(TASKS.map((t) => [t.id, blankTaskState(t)])),
});

const ensureDay = (day) => {
  const base = blankDay();
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

export const isDayComplete = (day) => {
  if (!day?.tasks) return false;
  return TASKS.every((t) => day.tasks[t.id]?.done);
};

const completedCount = (day) => {
  if (!day?.tasks) return 0;
  return TASKS.reduce((acc, t) => acc + (day.tasks[t.id]?.done ? 1 : 0), 0);
};

const computeStreaks = (history) => {
  // longest = scan all days in order; gaps reset run
  const days = Object.keys(history).sort();
  let longest = 0;
  let run = 0;
  let prev = null;
  for (const k of days) {
    const complete = isDayComplete(history[k]);
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
  if (isDayComplete(history[todayK])) current += 1;
  cursor.setDate(cursor.getDate() - 1);
  while (true) {
    const k = dateKey(cursor);
    if (isDayComplete(history[k])) {
      current += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }

  return { current, longest };
};

const loadInitial = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    const history = parsed?.history || {};
    const today = todayKey();
    if (!history[today]) history[today] = blankDay();
    else history[today] = ensureDay(history[today]);
    return { history };
  } catch {
    return { history: { [todayKey()]: blankDay() } };
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
          const yesterday = ensureDay(history[prevDay]);
          const frozenTasks = { ...yesterday.tasks };
          for (const task of TASKS) {
            const ts = frozenTasks[task.id];
            if (ts?.runningSince) {
              const elapsed = Math.floor((Date.now() - ts.runningSince) / 1000);
              frozenTasks[task.id] = { ...ts, time: (ts.time || 0) + elapsed, runningSince: null };
            }
          }
          history[prevDay] = { ...yesterday, tasks: frozenTasks };
          if (!history[t]) history[t] = blankDay();
          return { ...prev, history };
        });
      }
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const today = todayKey();
  const todayDay = useMemo(() => ensureDay(state.history[today]), [state.history, today]);

  const updateTask = useCallback((taskId, updater) => {
    setState((prev) => {
      const day = ensureDay(prev.history[today]);
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
      const task = TASKS.find((x) => x.id === taskId);
      // auto-mark done when target reached
      const autoDone = task?.countable && task.targetCount && safe >= task.targetCount;
      return { ...t, count: safe, done: autoDone ? true : t.done };
    });
  }, [updateTask]);

  const liveTime = useCallback((taskState) => {
    if (!taskState) return 0;
    if (!taskState.runningSince) return taskState.time || 0;
    return (taskState.time || 0) + Math.floor((now - taskState.runningSince) / 1000);
  }, [now]);

  const streaks = useMemo(() => computeStreaks(state.history), [state.history]);
  const todayCompleted = completedCount(todayDay);

  return {
    today,
    todayDay,
    todayCompleted,
    totalTasks: TASK_COUNT,
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
