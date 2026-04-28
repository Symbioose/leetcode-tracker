import { useState, useEffect } from "react";
import { CheckCircle2, Circle, Calendar, ExternalLink, Minus, Play, Square, Clock } from "lucide-react";

const DIFFICULTY_COLOR = {
  Easy: "text-green-600",
  Medium: "text-yellow-600",
  Hard: "text-red-600",
};

const FEELING_CONFIG = {
  easy:   { bg: "bg-green-500" },
  medium: { bg: "bg-yellow-500" },
  hard:   { bg: "bg-red-500" },
};

const formatTime = (totalSeconds) => {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

const ProblemTable = ({
  problems,
  progress,
  toggleComplete,
  getReviewDueDates,
  recordTime,
  filterCategory,
  filterDifficulty,
  showOnlyDueToday,
}) => {
  const today = new Date().toISOString().split("T")[0];
  const [expandedReview, setExpandedReview] = useState(null);
  // activeTimer: { problemId, startTime (ms) } | null
  const [activeTimer, setActiveTimer] = useState(null);
  const [elapsed, setElapsed] = useState(0);

  // Live clock tick
  useEffect(() => {
    if (!activeTimer) { setElapsed(0); return; }
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - activeTimer.startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [activeTimer]);

  const startTimer = (problemId) => {
    setActiveTimer({ problemId, startTime: Date.now() });
    setElapsed(0);
  };

  const stopTimer = (problemId) => {
    if (!activeTimer || activeTimer.problemId !== problemId) return;
    const duration = Math.floor((Date.now() - activeTimer.startTime) / 1000);
    setActiveTimer(null);
    setElapsed(0);
    if (duration > 0) recordTime(problemId, duration);
  };

  const filteredProblems = problems.filter((problem) => {
    const categoryMatch = filterCategory === "All" || (problem.topics || []).includes(filterCategory);
    const difficultyMatch = filterDifficulty === "All" || problem.difficulty === filterDifficulty;
    if (!showOnlyDueToday) return categoryMatch && difficultyMatch;
    const prob = progress[problem.id];
    if (!prob?.solved) return false;
    const isDue = getReviewDueDates(prob).some((date, idx) => !prob.reviews?.[idx] && date <= today);
    return categoryMatch && difficultyMatch && isDue;
  });

  const formatDate = (dateStr) =>
    new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });

  const handleReviewClick = (problem, reviewIndex, prob, isCompleted, date) => {
    if (isCompleted) {
      setExpandedReview(null);
      toggleComplete(problem.id, reviewIndex, null);
      return;
    }
    if (date <= today) {
      setExpandedReview({ problemId: problem.id, reviewIndex });
    } else {
      toggleComplete(problem.id, reviewIndex, "medium");
    }
  };

  const handleFeelingClick = (problemId, reviewIndex, feeling) => {
    setExpandedReview(null);
    toggleComplete(problemId, reviewIndex, feeling);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-colors">
      <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Problems</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-10">#</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[180px]">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-36">Category</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-20">Diff.</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-36">Companies</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-28">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-28">Timer</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[280px]">Reviews</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {filteredProblems.map((problem, index) => {
              const prob = progress[problem.id] || {};
              const dueDates = getReviewDueDates(prob);
              const isTimingThis = activeTimer?.problemId === problem.id;
              const timeLogs = prob.timeLogs || [];
              const bestTime = timeLogs.length ? Math.min(...timeLogs.map((l) => l.duration)) : null;
              const lastTime = timeLogs.length ? timeLogs[timeLogs.length - 1].duration : null;

              return (
                <tr key={problem.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{index + 1}</td>

                  <td className="px-4 py-4 text-sm text-gray-900 dark:text-gray-100">
                    <a
                      href={problem.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                    >
                      <span className="line-clamp-2">{problem.title}</span>
                      <ExternalLink size={14} className="flex-shrink-0" />
                    </a>
                  </td>

                  <td className="px-4 py-4 text-sm text-gray-900 dark:text-gray-100">
                    <div className="flex flex-wrap gap-1 max-w-[144px]">
                      {problem.listMeta?.section || problem.listMeta?.module ? (
                        <span className="px-2 py-0.5 text-xs bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded">
                          {problem.listMeta.section || problem.listMeta.module}
                        </span>
                      ) : null}
                      {(problem.topics || []).map((t, idx) => (
                        <span key={idx} className="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded">{t}</span>
                      ))}
                    </div>
                  </td>

                  <td className={`px-4 py-4 whitespace-nowrap text-sm font-semibold ${DIFFICULTY_COLOR[problem.difficulty]}`}>
                    {problem.difficulty}
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1 flex-wrap max-w-[144px]">
                      {problem.companies?.length > 0 ? (
                        problem.companies.map((company, idx) => (
                          <div key={idx} className="relative group" title={company.name}>
                            {company.logo ? (
                              <img src={company.logo} alt={company.name} className="h-6 w-6 object-contain hover:scale-110 transition-transform" />
                            ) : (
                              <div className="h-6 w-6 bg-gray-300 dark:bg-gray-700 rounded flex items-center justify-center text-xs font-semibold text-gray-800 dark:text-gray-100 hover:scale-110 transition-transform">
                                {company.name[0]}
                              </div>
                            )}
                            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                              {company.name}
                            </span>
                          </div>
                        ))
                      ) : (
                        <Minus size={16} className="text-gray-300 dark:text-gray-600" />
                      )}
                    </div>
                  </td>

                  <td className="px-4 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleComplete(problem.id)}
                      className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                    >
                      {prob.solved ? (
                        <CheckCircle2 className="text-green-600 dark:text-green-500" size={20} />
                      ) : (
                        <Circle size={20} />
                      )}
                      <span className="text-xs">{prob.solved ? "Solved" : "Unsolved"}</span>
                    </button>
                  </td>

                  {/* Timer column */}
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      {isTimingThis ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-mono font-semibold text-orange-500 dark:text-orange-400 tabular-nums">
                            {formatTime(elapsed)}
                          </span>
                          <button
                            onClick={() => stopTimer(problem.id)}
                            title="Stop timer"
                            className="p-1 rounded bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                          >
                            <Square size={12} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startTimer(problem.id)}
                          title="Start timer"
                          disabled={activeTimer !== null}
                          className={`flex items-center gap-1 text-xs px-2 py-1 rounded border transition-colors ${
                            activeTimer
                              ? "border-gray-200 dark:border-gray-700 text-gray-300 dark:text-gray-600 cursor-not-allowed"
                              : "border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-orange-400 hover:text-orange-500 dark:hover:text-orange-400"
                          }`}
                        >
                          <Play size={10} /> Start
                        </button>
                      )}

                      {/* Best / last times */}
                      {bestTime !== null && (
                        <div className="flex items-center gap-1 text-[10px] text-gray-400 dark:text-gray-500">
                          <Clock size={9} />
                          <span title="Best time" className="text-green-600 dark:text-green-400 font-medium">
                            {formatTime(bestTime)}
                          </span>
                          {timeLogs.length > 1 && lastTime !== bestTime && (
                            <>
                              <span>·</span>
                              <span title="Last time">{formatTime(lastTime)}</span>
                            </>
                          )}
                        </div>
                      )}
                      {timeLogs.length > 1 && (
                        <span className="text-[10px] text-gray-400 dark:text-gray-500">{timeLogs.length}× timed</span>
                      )}
                    </div>
                  </td>

                  {/* Reviews column */}
                  <td className="px-4 py-4">
                    {prob.solved ? (
                      <div className="flex flex-wrap gap-2">
                        {dueDates.map((date, idx) => {
                          const isCompleted = prob.reviews?.[idx];
                          const overdue = !isCompleted && date < today;
                          const dueToday = !isCompleted && date === today;
                          const feeling = prob.feelings?.[idx];
                          const isExpanded =
                            expandedReview?.problemId === problem.id &&
                            expandedReview?.reviewIndex === idx;

                          return (
                            <div key={idx} className="flex flex-col items-center gap-1">
                              {isExpanded ? (
                                <div className="flex gap-1">
                                  {["hard", "medium", "easy"].map((f) => (
                                    <button
                                      key={f}
                                      onClick={() => handleFeelingClick(problem.id, idx, f)}
                                      className={`px-1.5 py-1 rounded text-[10px] font-bold border transition-colors ${
                                        f === "hard"
                                          ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-300 hover:bg-red-200"
                                          : f === "medium"
                                          ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-300 hover:bg-yellow-200"
                                          : "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-300 hover:bg-green-200"
                                      }`}
                                    >
                                      {f[0].toUpperCase()}
                                    </button>
                                  ))}
                                  <button
                                    onClick={() => setExpandedReview(null)}
                                    className="px-1.5 py-1 rounded text-[10px] border border-gray-300 dark:border-gray-600 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ) : (
                                <div className="relative">
                                  <button
                                    onClick={() => handleReviewClick(problem, idx, prob, isCompleted, date)}
                                    title={`R${idx + 1} — Due ${formatDate(date)}${feeling ? ` — felt ${feeling}` : ""}`}
                                    className={`px-2 py-1 rounded text-xs border min-w-[40px] transition-colors ${
                                      isCompleted
                                        ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-300 dark:border-green-600"
                                        : overdue
                                        ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-300 dark:border-red-600"
                                        : dueToday
                                        ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-600"
                                        : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600"
                                    }`}
                                  >
                                    R{idx + 1}
                                  </button>
                                  {isCompleted && feeling && (
                                    <span
                                      className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full ${FEELING_CONFIG[feeling]?.bg}`}
                                      title={`Felt ${feeling}`}
                                    />
                                  )}
                                </div>
                              )}

                              <div
                                className={`text-[10px] flex items-center gap-0.5 ${
                                  isCompleted
                                    ? "text-green-600 dark:text-green-400"
                                    : overdue
                                    ? "text-red-600 dark:text-red-400"
                                    : dueToday
                                    ? "text-yellow-600 dark:text-yellow-400"
                                    : "text-gray-500 dark:text-gray-300"
                                }`}
                              >
                                <Calendar size={10} />
                                {formatDate(date)}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        Complete problem to see review schedule
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProblemTable;
