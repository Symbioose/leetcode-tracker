import { useState, useEffect, useMemo } from 'react';
import { Target, TrendingUp, TrendingDown, Minus, CalendarDays, Home, Flame } from 'lucide-react';
import {
  PLAN_START,
  PLAN_TARGET,
  PLAN_PHASES,
  BASELINE_KEY,
  parseISO,
  isoKey,
  phaseForKey,
  capacityBetween,
} from '../data/studyPlan';

const START_DATE = parseISO(PLAN_START);
const TARGET_DATE = parseISO(PLAN_TARGET);

const daysBetween = (a, b) => Math.round((b - a) / 86400000);

const formatDate = (d) =>
  d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });

const formatShort = (iso) =>
  parseISO(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

const PHASE_ICONS = { preflight: Home, rush: Flame };

const PHASE_STYLES = {
  preflight: {
    seg: 'bg-blue-300 dark:bg-blue-800',
    icon: 'text-blue-600 dark:text-blue-400',
    active: 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20',
  },
  rush: {
    seg: 'bg-rose-300 dark:bg-rose-800',
    icon: 'text-rose-600 dark:text-rose-400',
    active: 'ring-2 ring-rose-500 bg-rose-50 dark:bg-rose-900/20',
  },
};

const readPlanMeta = () => {
  try {
    const raw = localStorage.getItem(BASELINE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const StudyPlan = ({ stats, activity }) => {
  // Snapshot of where we stood when the re-plan went live — the ahead/behind
  // indicator measures against this, not against the abandoned May plan.
  const [baseline, setBaseline] = useState(() => {
    const meta = readPlanMeta();
    return Number.isFinite(meta.baselineSolved) && meta.baselineDate
      ? { date: meta.baselineDate, solved: meta.baselineSolved }
      : null;
  });

  useEffect(() => {
    if (baseline) return;
    const todayK = isoKey(new Date());
    const fresh = { date: todayK < PLAN_START ? PLAN_START : todayK, solved: stats.solved };
    try {
      const meta = readPlanMeta();
      localStorage.setItem(
        BASELINE_KEY,
        JSON.stringify({ ...meta, baselineDate: fresh.date, baselineSolved: fresh.solved })
      );
      window.dispatchEvent(new Event('local-data-changed'));
    } catch { /* ignore */ }
    setBaseline(fresh);
  }, [baseline, stats.solved]);

  const {
    daysLeft,
    remaining,
    requiredToday,
    currentPhase,
    phaseCards,
    currentPace,
    projectedDate,
    timelinePercent,
    isOnTrack,
    delta,
  } = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const todayK = isoKey(now);

    const daysLeft = Math.max(0, daysBetween(now, TARGET_DATE));
    const remaining = stats.total - stats.solved;

    // Distribute what's left proportionally to each phase's daily capacity:
    // falling behind in one phase automatically raises the next one's target.
    const fromK = todayK < PLAN_START ? PLAN_START : todayK;
    const remainingCap = capacityBetween(fromK, PLAN_TARGET);
    const scale = remaining > 0 && remainingCap > 0 ? remaining / remainingCap : 0;

    const currentPhase = phaseForKey(todayK);
    let requiredToday;
    if (remaining <= 0) requiredToday = 0;
    else if (currentPhase && remainingCap > 0) requiredToday = +(currentPhase.perDay * scale).toFixed(1);
    else requiredToday = daysLeft > 0 ? +(remaining / daysLeft).toFixed(1) : remaining;

    const totalPlanDays = daysBetween(START_DATE, TARGET_DATE) + 1;
    const phaseCards = PLAN_PHASES.map((p) => {
      const days = daysBetween(parseISO(p.start), parseISO(p.end)) + 1;
      return {
        ...p,
        days,
        widthPercent: (days / totalPlanDays) * 100,
        isPast: p.end < todayK,
        isCurrent: todayK >= p.start && todayK <= p.end,
        target: remaining <= 0 ? 0 : +(p.perDay * scale).toFixed(1),
      };
    });

    // Current pace: actions/day over last 14 days (proxy for solved/reviewed problems).
    const windowDays = 14;
    const winStart = new Date(now);
    winStart.setDate(winStart.getDate() - windowDays);
    const winStartStr = isoKey(winStart);
    const recentActivity = Object.entries(activity)
      .filter(([date]) => date >= winStartStr)
      .reduce((sum, [, count]) => sum + count, 0);
    const currentPace = +(recentActivity / windowDays).toFixed(1);

    // Projected finish at current pace
    let projectedDate = null;
    if (remaining === 0) {
      projectedDate = now;
    } else if (currentPace > 0) {
      const daysNeeded = Math.ceil(remaining / currentPace);
      const projected = new Date(now);
      projected.setDate(projected.getDate() + daysNeeded);
      projectedDate = projected;
    }

    const elapsed = daysBetween(START_DATE, now);
    const timelinePercent = Math.min(100, Math.max(0, (elapsed / totalPlanDays) * 100));
    const isOnTrack = projectedDate ? projectedDate <= TARGET_DATE : null;

    // Ahead/behind vs the phase-aware expected curve, from the baseline snapshot.
    let delta = null;
    if (baseline && Number.isFinite(baseline.solved)) {
      const totalCap = capacityBetween(baseline.date, PLAN_TARGET);
      if (totalCap > 0) {
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const consumed = capacityBetween(baseline.date, isoKey(yesterday));
        const expected =
          baseline.solved + (stats.total - baseline.solved) * (consumed / totalCap);
        delta = Math.round(stats.solved - expected);
      }
    }

    return {
      daysLeft,
      remaining,
      requiredToday,
      currentPhase,
      phaseCards,
      currentPace,
      projectedDate,
      timelinePercent,
      isOnTrack,
      delta,
    };
  }, [stats, activity, baseline]);

  const completion = stats.total > 0 ? Math.round((stats.solved / stats.total) * 100) : 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6 transition-colors">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Target size={20} className="text-blue-600 dark:text-blue-400" />
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Study Plan</h2>
        </div>
        <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
          <CalendarDays size={14} />
          <span>Objectif : {formatDate(TARGET_DATE)}</span>
        </div>
      </div>

      {/* Phase timeline */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mb-1">
          <span>{formatDate(START_DATE)}</span>
          <span>{formatDate(TARGET_DATE)}</span>
        </div>
        <div className="relative h-3 rounded-full overflow-hidden flex">
          {phaseCards.map((p) => (
            <div
              key={p.id}
              className={`h-full ${PHASE_STYLES[p.id].seg}`}
              style={{ width: `${p.widthPercent}%` }}
              title={`${p.name} · ${p.hoursLabel}`}
            />
          ))}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-orange-600"
            style={{ left: `${timelinePercent}%` }}
          >
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-orange-600 rounded-full" />
          </div>
        </div>

        {/* Completion bar */}
        <div className="relative h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mt-1.5">
          <div
            className="absolute inset-y-0 left-0 bg-blue-400 dark:bg-blue-600 rounded-full transition-all"
            style={{ width: `${completion}%` }}
          />
        </div>
        <div className="flex justify-between text-xs mt-1">
          <span className="text-blue-600 dark:text-blue-400">{completion}% résolus</span>
          <span className="text-orange-500">{daysLeft} jours restants</span>
        </div>
      </div>

      {/* Phase cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        {phaseCards.map((p) => {
          const Icon = PHASE_ICONS[p.id];
          const style = PHASE_STYLES[p.id];
          return (
            <div
              key={p.id}
              className={`rounded-lg p-3 border border-gray-100 dark:border-gray-700 ${
                p.isCurrent ? style.active : p.isPast ? 'opacity-50' : 'bg-gray-50 dark:bg-gray-700/40'
              }`}
            >
              <div className="flex items-center gap-2">
                <Icon size={16} className={style.icon} />
                <span className="text-sm font-semibold text-gray-800 dark:text-white">{p.name}</span>
                {p.isCurrent && (
                  <span className="ml-auto text-[10px] font-bold uppercase tracking-wide text-orange-500">
                    en cours
                  </span>
                )}
                {p.isPast && (
                  <span className="ml-auto text-[10px] uppercase tracking-wide text-gray-400">
                    terminé
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {formatShort(p.start)} → {formatShort(p.end)} · {p.hoursLabel}
              </div>
              {!p.isPast && (
                <div className="mt-2 text-lg font-bold text-gray-800 dark:text-white">
                  {p.target}
                  <span className="text-xs font-normal text-gray-500 dark:text-gray-400"> pb/jour</span>
                </div>
              )}
              <div className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">{p.note}</div>
            </div>
          );
        })}
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
          <div className="text-xl font-bold text-gray-800 dark:text-white">{remaining}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">problèmes restants</div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
          <div className="text-xl font-bold text-blue-600 dark:text-blue-400">{requiredToday}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            objectif aujourd'hui{currentPhase ? ` (${currentPhase.name})` : ''}
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
          <div className="text-xl font-bold text-gray-800 dark:text-white">{currentPace}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">actions / jour (×14j)</div>
        </div>

        <div
          className={`rounded-lg p-3 ${
            isOnTrack === null
              ? 'bg-gray-50 dark:bg-gray-700/50'
              : isOnTrack
              ? 'bg-green-50 dark:bg-green-900/20'
              : 'bg-red-50 dark:bg-red-900/20'
          }`}
        >
          <div
            className={`flex items-center gap-1 text-xl font-bold ${
              isOnTrack === null
                ? 'text-gray-400'
                : isOnTrack
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            }`}
          >
            {isOnTrack === null ? (
              <Minus size={20} />
            ) : isOnTrack ? (
              <TrendingUp size={20} />
            ) : (
              <TrendingDown size={20} />
            )}
            {isOnTrack === null ? '—' : isOnTrack ? 'On track' : 'Behind'}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {projectedDate ? `Proj. ${formatDate(projectedDate)}` : 'Start solving!'}
          </div>
        </div>
      </div>

      {/* Retard / avance vs le plan re-calé du 15 juillet */}
      {delta !== null && (
        <div
          className={`mt-4 flex items-center justify-center gap-2 rounded-lg py-2.5 px-4 text-sm font-medium ${
            delta === 0
              ? 'bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400'
              : delta > 0
              ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
              : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
          }`}
        >
          {delta === 0
            ? 'Dans les temps exactement (plan du 15 juillet).'
            : delta > 0
            ? `${delta} problème${delta > 1 ? 's' : ''} d'avance sur le plan.`
            : `${Math.abs(delta)} problème${Math.abs(delta) > 1 ? 's' : ''} de retard sur le plan.`}
        </div>
      )}

      {/* Motivation callout */}
      {stats.total > 0 && (
        <div className="mt-4 text-xs text-gray-400 dark:text-gray-500 text-center">
          {stats.solved === stats.total
            ? '🎉 NeetCode 150 terminé — continue les révisions jusqu\'aux entretiens !'
            : `Fin du NeetCode 150 le ${formatDate(TARGET_DATE)} · entretiens sept-nov`}
        </div>
      )}
    </div>
  );
};

export default StudyPlan;
