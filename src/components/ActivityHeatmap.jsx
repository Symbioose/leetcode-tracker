import { useMemo } from 'react';
import { Flame, Star } from 'lucide-react';

const LEVELS = [
  'bg-gray-100 dark:bg-gray-700',
  'bg-green-200 dark:bg-green-900',
  'bg-green-400 dark:bg-green-700',
  'bg-green-500 dark:bg-green-500',
];

const getLevel = (count) => {
  if (!count) return 0;
  if (count <= 2) return 1;
  if (count <= 5) return 2;
  return 3;
};

const dateStr = (d) => [
  d.getFullYear(),
  String(d.getMonth() + 1).padStart(2, '0'),
  String(d.getDate()).padStart(2, '0'),
].join('-');

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const ActivityHeatmap = ({ activity, streaks }) => {
  const { weeks, monthMarkers } = useMemo(() => {
    const WEEKS = 18;
    const today = new Date();

    // Align start to the previous Sunday
    const start = new Date(today);
    start.setDate(today.getDate() - WEEKS * 7 + 1);
    start.setDate(start.getDate() - start.getDay());

    const allWeeks = [];
    const markers = []; // { weekIndex, label }
    let prevMonth = -1;
    let d = new Date(start);

    for (let w = 0; w < WEEKS; w++) {
      const week = [];
      for (let day = 0; day < 7; day++) {
        const s = dateStr(d);
        week.push({ date: s, count: activity[s] ?? 0 });
        if (day === 0 && d.getMonth() !== prevMonth) {
          markers.push({ weekIndex: w, label: MONTH_LABELS[d.getMonth()] });
          prevMonth = d.getMonth();
        }
        d.setDate(d.getDate() + 1);
      }
      allWeeks.push(week);
    }

    return { weeks: allWeeks, monthMarkers: markers };
  }, [activity]);

  const today = dateStr(new Date());
  const totalActivity = Object.values(activity).reduce((a, b) => a + b, 0);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6 transition-colors">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Activity</h2>
        <div className="flex gap-5">
          <div className="flex items-center gap-1.5">
            <Flame size={18} className="text-orange-500" />
            <div>
              <span className="text-xl font-bold text-orange-500">{streaks.current}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">day streak</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Star size={16} className="text-gray-400 dark:text-gray-500" />
            <div>
              <span className="text-xl font-bold text-gray-700 dark:text-gray-200">{streaks.longest}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">best</span>
            </div>
          </div>
        </div>
      </div>

      {/* Month labels */}
      <div className="relative flex gap-1 mb-1 ml-0">
        {weeks.map((_, wi) => {
          const marker = monthMarkers.find((m) => m.weekIndex === wi);
          return (
            <div key={wi} className="w-3 text-[9px] text-gray-400 dark:text-gray-500 truncate">
              {marker ? marker.label : ''}
            </div>
          );
        })}
      </div>

      {/* Heatmap grid */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map(({ date, count }) => (
              <div
                key={date}
                title={count ? `${date}: ${count} action${count !== 1 ? 's' : ''}` : date}
                className={`w-3 h-3 rounded-sm flex-shrink-0 transition-colors ${LEVELS[getLevel(count)]} ${date === today ? 'ring-1 ring-orange-400 ring-offset-1 ring-offset-white dark:ring-offset-gray-800' : ''}`}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between mt-3">
        <span className="text-xs text-gray-400 dark:text-gray-500">
          {totalActivity} total actions
        </span>
        <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
          <span>Less</span>
          {LEVELS.map((cls, i) => (
            <div key={i} className={`w-3 h-3 rounded-sm ${cls}`} />
          ))}
          <span>More</span>
        </div>
      </div>
    </div>
  );
};

export default ActivityHeatmap;
