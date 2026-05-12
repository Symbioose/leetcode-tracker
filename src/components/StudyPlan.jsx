import { useMemo } from 'react';
import { Target, TrendingUp, TrendingDown, Minus, CalendarDays } from 'lucide-react';

// 75-day NeetCode 150 challenge, starting May 4, 2026 → ends July 18, 2026.
const START_DATE = new Date(2026, 4, 4); // May 4, 2026
const PLAN_DAYS = 75;
const PROBLEMS_PER_DAY = 2;
const TARGET_DATE = new Date(START_DATE);
TARGET_DATE.setDate(START_DATE.getDate() + PLAN_DAYS);

const daysBetween = (a, b) => Math.round((b - a) / 86400000);

const formatDate = (d) =>
  d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const StudyPlan = ({ stats, activity }) => {
  const { daysLeft, requiredPerDay, projectedDate, currentPace, timelinePercent, isOnTrack } =
    useMemo(() => {
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      const daysLeft = Math.max(0, daysBetween(now, TARGET_DATE));
      const remaining = stats.total - stats.solved;
      const requiredPerDay = remaining > 0 && daysLeft > 0 ? +(remaining / daysLeft).toFixed(1) : 0;

      // Current pace: actions/day over last 14 days (proxy for solved/reviewed problems).
      const windowDays = 14;
      const winStart = new Date(now);
      winStart.setDate(winStart.getDate() - windowDays);
      const winStartStr = [
        winStart.getFullYear(),
        String(winStart.getMonth() + 1).padStart(2, '0'),
        String(winStart.getDate()).padStart(2, '0'),
      ].join('-');

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

      const totalDays = daysBetween(START_DATE, TARGET_DATE);
      const elapsed = daysBetween(START_DATE, now);
      const timelinePercent = Math.min(100, Math.max(0, (elapsed / totalDays) * 100));

      const isOnTrack = projectedDate ? projectedDate <= TARGET_DATE : null;

      return { daysLeft, requiredPerDay, projectedDate, currentPace, timelinePercent, isOnTrack };
    }, [stats, activity]);

  const completion = stats.total > 0 ? Math.round((stats.solved / stats.total) * 100) : 0;
  const dailyTargetLabel = Math.max(PROBLEMS_PER_DAY, Math.ceil(requiredPerDay));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6 transition-colors">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Target size={20} className="text-blue-600 dark:text-blue-400" />
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Study Plan</h2>
        </div>
        <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
          <CalendarDays size={14} />
          <span>Target: {formatDate(TARGET_DATE)}</span>
        </div>
      </div>

      {/* Timeline bar */}
      <div className="mb-5">
        <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mb-1">
          <span>{formatDate(START_DATE)}</span>
          <span>{formatDate(TARGET_DATE)}</span>
        </div>
        <div className="relative h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-blue-200 dark:bg-blue-900/50 rounded-full transition-all"
            style={{ width: `${completion}%` }}
          />
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-orange-500"
            style={{ left: `${timelinePercent}%` }}
          >
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-orange-500 rounded-full" />
          </div>
        </div>
        <div className="flex justify-between text-xs mt-1">
          <span className="text-blue-600 dark:text-blue-400">{completion}% solved</span>
          <span className="text-orange-500">{daysLeft} days left</span>
        </div>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
          <div className="text-xl font-bold text-gray-800 dark:text-white">
            {stats.total - stats.solved}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">problems left</div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
          <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
            {requiredPerDay}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">needed / day</div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
          <div className="text-xl font-bold text-gray-800 dark:text-white">
            {currentPace}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">actions / day (×14d)</div>
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

      {/* Motivation callout */}
      {stats.total > 0 && (
        <div className="mt-4 text-xs text-gray-400 dark:text-gray-500 text-center">
          {stats.solved === 0
            ? `Goal: ${PROBLEMS_PER_DAY} problems/day for ${PLAN_DAYS} days → finish by ${formatDate(TARGET_DATE)}`
            : stats.solved === stats.total
            ? '🎉 All problems solved — keep reviewing!'
            : `${dailyTargetLabel} problems/day · ${daysLeft} days left to finish NeetCode 150`}
        </div>
      )}
    </div>
  );
};

export default StudyPlan;
