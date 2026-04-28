import { useMemo } from 'react';
import { Target, TrendingUp, TrendingDown, Minus, CalendarDays } from 'lucide-react';

const TARGET_DATE = new Date(2026, 10, 30); // November 30, 2026

const daysBetween = (a, b) => Math.round((b - a) / 86400000);

const formatDate = (d) =>
  d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const StudyPlan = ({ stats, activity }) => {
  const { weeksLeft, daysLeft, requiredPerWeek, projectedDate, currentPace, timelinePercent, isOnTrack } =
    useMemo(() => {
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      const daysLeft = Math.max(0, daysBetween(now, TARGET_DATE));
      const weeksLeft = Math.max(1, daysLeft / 7);
      const remaining = stats.total - stats.solved;
      const requiredPerWeek = remaining > 0 ? +(remaining / weeksLeft).toFixed(1) : 0;

      // Current pace: problems solved in last 4 weeks
      const fourWeeksAgo = new Date(now);
      fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
      const fwStr = [
        fourWeeksAgo.getFullYear(),
        String(fourWeeksAgo.getMonth() + 1).padStart(2, '0'),
        String(fourWeeksAgo.getDate()).padStart(2, '0'),
      ].join('-');

      // We use activity as a proxy (each action ≈ 1 problem/review, not perfect but indicative)
      // Better: count solvedDates from progress — but we don't have that here.
      // We'll show actions/week as pace indicator.
      const recentActivity = Object.entries(activity)
        .filter(([date]) => date >= fwStr)
        .reduce((sum, [, count]) => sum + count, 0);
      const currentPace = +(recentActivity / 4).toFixed(1); // actions/week

      // Projected finish based on required pace
      let projectedDate = null;
      if (requiredPerWeek > 0 && currentPace > 0) {
        const weeksNeeded = remaining / currentPace;
        const projected = new Date(now);
        projected.setDate(projected.getDate() + Math.ceil(weeksNeeded * 7));
        projectedDate = projected;
      } else if (remaining === 0) {
        projectedDate = now;
      }

      // Timeline: progress from first solve date to target
      const startDate = new Date(2026, 3, 28); // project start (today for simplicity)
      const totalDays = daysBetween(startDate, TARGET_DATE);
      const elapsed = daysBetween(startDate, now);
      const timelinePercent = Math.min(100, Math.max(0, (elapsed / totalDays) * 100));

      // On track: projected finish <= target
      const isOnTrack = projectedDate ? projectedDate <= TARGET_DATE : null;

      return { weeksLeft, daysLeft, requiredPerWeek, projectedDate, currentPace, timelinePercent, isOnTrack };
    }, [stats, activity]);

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
          <span>Target: {formatDate(TARGET_DATE)}</span>
        </div>
      </div>

      {/* Timeline bar */}
      <div className="mb-5">
        <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mb-1">
          <span>Apr 28</span>
          <span>Nov 30, 2026</span>
        </div>
        <div className="relative h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
          {/* Completion fill */}
          <div
            className="absolute inset-y-0 left-0 bg-blue-200 dark:bg-blue-900/50 rounded-full transition-all"
            style={{ width: `${completion}%` }}
          />
          {/* Time elapsed cursor */}
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
            {requiredPerWeek}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">needed / week</div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
          <div className="text-xl font-bold text-gray-800 dark:text-white">
            {currentPace}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">actions / week (×4w)</div>
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
            ? `Solve ${Math.ceil(requiredPerWeek)} problems/week to finish NeetCode 150 by Nov 30`
            : stats.solved === stats.total
            ? '🎉 All problems solved — keep reviewing!'
            : `${Math.ceil(requiredPerWeek)} problems/week · interviews start Sep 2026`}
        </div>
      )}
    </div>
  );
};

export default StudyPlan;
