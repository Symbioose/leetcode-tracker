import { useMemo } from "react";
import { Flame, Trophy, Play, Pause, RotateCcw, Check } from "lucide-react";
import { useDailyChallenge, TASKS, dateKey } from "../hooks/useDailyChallenge";

const formatTime = (seconds) => {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
};

const TaskCard = ({ task, taskState, liveTime, onToggle, onStart, onStop, onReset, onCount }) => {
  const running = !!taskState.runningSince;
  const elapsed = liveTime(taskState);
  const done = taskState.done;

  return (
    <div
      className={`relative rounded-2xl p-5 border transition-all ${
        done
          ? "bg-emerald-50 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-700"
          : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
      }`}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={() => onToggle(task.id)}
          aria-label={done ? "Marquer comme non fait" : "Marquer comme fait"}
          className={`mt-0.5 h-7 w-7 flex-shrink-0 rounded-lg flex items-center justify-center transition-all ${
            done
              ? "bg-emerald-500 text-white"
              : "bg-gray-100 dark:bg-gray-700 text-transparent hover:bg-gray-200 dark:hover:bg-gray-600"
          }`}
        >
          <Check size={16} strokeWidth={3} />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="text-lg leading-none">{task.emoji}</span>
            <h3
              className={`font-semibold text-gray-900 dark:text-white truncate ${
                done ? "line-through opacity-70" : ""
              }`}
            >
              {task.label}
            </h3>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{task.target}</p>
        </div>
      </div>

      {task.countable && (
        <div className="mt-4 flex items-center gap-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">Fait :</span>
          <button
            onClick={() => onCount(task.id, Math.max(0, (taskState.count || 0) - 1))}
            className="h-7 w-7 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 text-lg leading-none"
          >
            −
          </button>
          <span className="font-mono text-sm tabular-nums text-gray-900 dark:text-white min-w-[2.5rem] text-center">
            {taskState.count || 0}/{task.targetCount}
          </span>
          <button
            onClick={() => onCount(task.id, (taskState.count || 0) + 1)}
            className="h-7 w-7 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 text-lg leading-none"
          >
            +
          </button>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between gap-3">
        <div
          className={`font-mono text-xl tabular-nums ${
            running ? "text-emerald-600 dark:text-emerald-400" : "text-gray-700 dark:text-gray-200"
          }`}
        >
          {formatTime(elapsed)}
        </div>
        <div className="flex items-center gap-1.5">
          {running ? (
            <button
              onClick={() => onStop(task.id)}
              className="h-9 px-3 rounded-lg bg-rose-500 hover:bg-rose-600 text-white flex items-center gap-1.5 text-sm font-medium"
            >
              <Pause size={14} /> Stop
            </button>
          ) : (
            <button
              onClick={() => onStart(task.id)}
              className="h-9 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white flex items-center gap-1.5 text-sm font-medium"
            >
              <Play size={14} /> Start
            </button>
          )}
          <button
            onClick={() => onReset(task.id)}
            aria-label="Reset timer"
            className="h-9 w-9 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

const HistoryCalendar = ({ history }) => {
  const { weeks, todayK } = useMemo(() => {
    const WEEKS = 16;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(today);
    start.setDate(today.getDate() - WEEKS * 7 + 1);
    // Align to Monday
    const day = start.getDay();
    const offset = day === 0 ? 6 : day - 1;
    start.setDate(start.getDate() - offset);

    const weeks = [];
    const cursor = new Date(start);
    for (let w = 0; w < WEEKS; w++) {
      const wk = [];
      for (let d = 0; d < 7; d++) {
        wk.push({ key: dateKey(cursor), date: new Date(cursor) });
        cursor.setDate(cursor.getDate() + 1);
      }
      weeks.push(wk);
    }
    return { weeks, todayK: dateKey(today) };
  }, []);

  const dayState = (k, dateObj) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayMs = dateObj.getTime();
    const todayMs = today.getTime();

    const entry = history[k];
    const completed = entry
      ? TASKS.reduce((a, t) => a + (entry.tasks?.[t.id]?.done ? 1 : 0), 0)
      : 0;

    if (dayMs > todayMs) return { cls: "bg-gray-100 dark:bg-gray-800", label: "À venir", completed };
    if (completed === TASKS.length) return { cls: "bg-emerald-500", label: "Complet", completed };
    if (dayMs === todayMs) {
      return {
        cls: completed > 0 ? "bg-amber-300 dark:bg-amber-600" : "bg-gray-200 dark:bg-gray-700",
        label: "Aujourd'hui",
        completed,
      };
    }
    if (!entry || completed === 0) return { cls: "bg-gray-200 dark:bg-gray-700", label: "Vide", completed };
    return { cls: "bg-rose-400 dark:bg-rose-600", label: "Manqué", completed };
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Historique</h2>
        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-emerald-500" /> 8/8</span>
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-rose-400 dark:bg-rose-600" /> manqué</span>
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-gray-200 dark:bg-gray-700" /> vide</span>
        </div>
      </div>
      <div className="flex gap-1 overflow-x-auto">
        {weeks.map((wk, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {wk.map(({ key, date }) => {
              const { cls, label, completed } = dayState(key, date);
              const isToday = key === todayK;
              return (
                <div
                  key={key}
                  title={`${key} — ${label} (${completed}/${TASKS.length})`}
                  className={`h-4 w-4 rounded-sm transition-colors ${cls} ${
                    isToday ? "ring-2 ring-offset-1 ring-offset-white dark:ring-offset-gray-800 ring-amber-500" : ""
                  }`}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

const DailyChallenge = () => {
  const {
    todayDay,
    todayCompleted,
    totalTasks,
    history,
    streaks,
    toggleDone,
    startTimer,
    stopTimer,
    resetTimer,
    setCount,
    liveTime,
  } = useDailyChallenge();

  const today = new Date();
  const dateLabel = today.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const progressPct = (todayCompleted / totalTasks) * 100;
  const allDone = todayCompleted === totalTasks;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 transition-colors">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Hero */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{dateLabel}</p>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mt-1">
                75 Hard
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Une tâche ratée, le streak repart à 0.
              </p>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1.5">
                  <Flame size={28} className="text-orange-500" />
                  <span className="text-4xl font-bold text-gray-900 dark:text-white tabular-nums">
                    {streaks.current}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">streak actuel</p>
              </div>
              <div className="h-12 w-px bg-gray-200 dark:bg-gray-700" />
              <div className="text-center">
                <div className="flex items-center justify-center gap-1.5">
                  <Trophy size={24} className="text-amber-400" />
                  <span className="text-3xl font-bold text-gray-700 dark:text-gray-200 tabular-nums">
                    {streaks.longest}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">record</p>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-6">
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Progression du jour
              </span>
              <span className="text-sm tabular-nums text-gray-700 dark:text-gray-200">
                <span className={`font-bold ${allDone ? "text-emerald-500" : ""}`}>
                  {todayCompleted}
                </span>
                <span className="text-gray-400 dark:text-gray-500">/{totalTasks}</span>
              </span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  allDone
                    ? "bg-gradient-to-r from-emerald-400 to-emerald-500"
                    : "bg-gradient-to-r from-blue-500 to-emerald-500"
                }`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
            {allDone && (
              <p className="mt-3 text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                ✨ Journée bouclée. À demain.
              </p>
            )}
          </div>
        </div>

        {/* Tasks grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {TASKS.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              taskState={todayDay.tasks[task.id]}
              liveTime={liveTime}
              onToggle={toggleDone}
              onStart={startTimer}
              onStop={stopTimer}
              onReset={resetTimer}
              onCount={setCount}
            />
          ))}
        </div>

        {/* History */}
        <HistoryCalendar history={history} />
      </div>
    </div>
  );
};

export default DailyChallenge;
