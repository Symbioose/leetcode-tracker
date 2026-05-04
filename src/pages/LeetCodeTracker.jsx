import { useState, useEffect } from "react";
import { Info, ExternalLink, Map as MapIcon, Play } from "lucide-react";
import {
  Filters,
  ProblemTable,
  ExportImportControls,
  CircularStatsCard,
  DailySession,
  ActivityHeatmap,
  StudyPlan,
  GistSyncPanel,
} from "../components";
import { neetcode150 } from "../data";
import { getReviewDueDates, computeNextDueDate } from "../utils/spacedRepetition";
import { migrateToNeetcode150, reshapeProgress } from "../utils/migrateToNeetcode150";
import { useActivity } from "../hooks/useActivity";
import { useGistSync } from "../hooks/useGistSync";

const LIST_NAME = "NeetCode 150";
const ROADMAP_URL = "https://neetcode.io/roadmap";

const EMPTY_PROB = {
  solved: false,
  reviews: Array(5).fill(false),
  feelings: Array(5).fill(null),
  reviewDueDates: Array(5).fill(null),
  dates: {},
};

// Run the migration once before mounting state — avoids stale reads.
migrateToNeetcode150();

const LeetCodeTracker = () => {
  const [progress, setProgress] = useState(() => {
    try {
      const saved = localStorage.getItem("leetcode-progress-v2");
      return saved ? JSON.parse(saved) : { [LIST_NAME]: {} };
    } catch {
      return { [LIST_NAME]: {} };
    }
  });

  const [filterCategory, setFilterCategory] = useState("All");
  const [filterDifficulty, setFilterDifficulty] = useState("All");
  const [showOnlyDueToday, setShowOnlyDueToday] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [sessionOpen, setSessionOpen] = useState(false);

  const { activity, recordActivity, streaks } = useActivity();
  const gistSync = useGistSync(progress, setProgress);

  useEffect(() => {
    try {
      localStorage.setItem("leetcode-progress-v2", JSON.stringify(progress));
    } catch (error) {
      console.error("Error saving progress:", error);
    }
  }, [progress]);

  // Reshape on the fly if a Gist pull brought back the old multi-list schema.
  useEffect(() => {
    if (progress["Blind 75"] || progress["LeetCode 75"]) {
      setProgress((prev) => reshapeProgress(prev));
    }
  }, [progress]);

  const today = new Date().toISOString().split("T")[0];
  const problems = neetcode150;
  const currentProgress = progress[LIST_NAME] || {};

  const toggleComplete = (problemId, reviewIndex = null, feeling = null) => {
    const todayStr = new Date().toISOString().split("T")[0];

    setProgress((prev) => {
      const listProgress = prev[LIST_NAME] || {};
      const current = listProgress[problemId] || { ...EMPTY_PROB };

      let newProbState;

      if (reviewIndex === null) {
        const newSolved = !current.solved;
        newProbState = {
          ...current,
          solved: newSolved,
          solvedDate: newSolved ? todayStr : null,
          reviews: newSolved ? current.reviews : Array(5).fill(false),
          feelings: newSolved ? current.feelings : Array(5).fill(null),
          reviewDueDates: newSolved ? current.reviewDueDates : Array(5).fill(null),
          dates: newSolved ? { ...current.dates, initial: todayStr } : {},
        };
      } else {
        const newReviews = [...current.reviews];
        newReviews[reviewIndex] = !newReviews[reviewIndex];
        const newDates = { ...current.dates };
        const newFeelings = [...(current.feelings || Array(5).fill(null))];
        const newReviewDueDates = [...(current.reviewDueDates || Array(5).fill(null))];

        if (newReviews[reviewIndex]) {
          newDates[`review${reviewIndex + 1}`] = todayStr;
          newFeelings[reviewIndex] = feeling;
          const nextDate = computeNextDueDate(todayStr, reviewIndex, feeling);
          if (nextDate && reviewIndex + 1 < 5) {
            newReviewDueDates[reviewIndex + 1] = nextDate;
          }
        } else {
          delete newDates[`review${reviewIndex + 1}`];
          newFeelings[reviewIndex] = null;
          if (reviewIndex + 1 < 5) {
            newReviewDueDates[reviewIndex + 1] = null;
          }
        }

        newProbState = {
          ...current,
          reviews: newReviews,
          dates: newDates,
          feelings: newFeelings,
          reviewDueDates: newReviewDueDates,
        };
      }

      return {
        ...prev,
        [LIST_NAME]: { ...listProgress, [problemId]: newProbState },
      };
    });

    const prob = (progress[LIST_NAME] || {})[problemId] || {};
    if (reviewIndex === null && !prob.solved) recordActivity();
    if (reviewIndex !== null && !prob.reviews?.[reviewIndex]) recordActivity();
  };

  const categories = ["All", ...Array.from(new Set(problems.flatMap((p) => p.topics || [])))];
  const difficulties = ["All", "Easy", "Medium", "Hard"];

  const stats = {
    total: problems.length,
    solved: problems.filter((p) => currentProgress[p.id]?.solved).length,
    easy: problems.filter((p) => p.difficulty === "Easy" && currentProgress[p.id]?.solved).length,
    medium: problems.filter((p) => p.difficulty === "Medium" && currentProgress[p.id]?.solved).length,
    hard: problems.filter((p) => p.difficulty === "Hard" && currentProgress[p.id]?.solved).length,
  };

  const getDueProblems = () =>
    problems.filter((problem) => {
      const prob = currentProgress[problem.id];
      if (!prob?.solved) return false;
      return getReviewDueDates(prob).some((date, idx) => !prob.reviews?.[idx] && date <= today);
    }).length;

  const recordTime = (problemId, durationSeconds) => {
    const todayStr = new Date().toISOString().split("T")[0];
    setProgress((prev) => {
      const listProgress = prev[LIST_NAME] || {};
      const current = listProgress[problemId] || { ...EMPTY_PROB };
      const timeLogs = [...(current.timeLogs || []), { date: todayStr, duration: durationSeconds }];
      return {
        ...prev,
        [LIST_NAME]: { ...listProgress, [problemId]: { ...current, timeLogs } },
      };
    });
  };

  const getDueItems = () => {
    const items = [];
    problems.forEach((problem) => {
      const prob = currentProgress[problem.id];
      if (!prob?.solved) return;
      getReviewDueDates(prob).forEach((date, idx) => {
        if (!prob.reviews?.[idx] && date <= today) {
          items.push({ problem, reviewIndex: idx });
        }
      });
    });
    return items;
  };

  const dueItems = getDueItems();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 transition-colors">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6 transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
                CodeTrack Pro — {LIST_NAME}
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Track your progress with spaced repetition
              </p>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <button
                onClick={() => setSessionOpen(true)}
                disabled={dueItems.length === 0}
                className={`flex items-center gap-2 px-4 py-2 rounded font-semibold transition-colors ${
                  dueItems.length > 0
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                }`}
                title={dueItems.length > 0 ? `${dueItems.length} review(s) due` : "No reviews due today"}
              >
                <Play size={16} />
                Start Session
                {dueItems.length > 0 && (
                  <span className="bg-white/30 text-white text-xs px-1.5 py-0.5 rounded-full">
                    {dueItems.length}
                  </span>
                )}
              </button>

              <a
                href={ROADMAP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded transition-colors"
                title="View the official roadmap"
              >
                <MapIcon size={16} /> Roadmap <ExternalLink size={14} />
              </a>

              <GistSyncPanel {...gistSync} />
            </div>
          </div>

          <div className="mt-4">
            <button
              onClick={() => setShowExplanation(!showExplanation)}
              className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm transition-colors"
            >
              <Info size={16} />
              {showExplanation ? "Hide" : "Show"} Spaced Repetition Info
            </button>
          </div>
        </div>

        {showExplanation && (
          <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-6 transition-colors">
            <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-300 mb-3">
              How Adaptive Spaced Repetition Works
            </h3>
            <div className="text-blue-700 dark:text-blue-200 space-y-2">
              <p>Reviews adapt based on how you felt — Easy intervals double, Hard intervals halve.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <h4 className="font-semibold mb-2">Base Schedule:</h4>
                  <ul className="space-y-1 text-sm">
                    <li><strong>R1:</strong> +1 day</li>
                    <li><strong>R2:</strong> +3 days</li>
                    <li><strong>R3:</strong> +7 days (1 week)</li>
                    <li><strong>R4:</strong> +14 days (2 weeks)</li>
                    <li><strong>R5:</strong> +30 days (1 month)</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Feeling Adjustments:</h4>
                  <ul className="space-y-1 text-sm">
                    <li><strong>Easy (green dot):</strong> next interval ×2</li>
                    <li><strong>Medium (yellow dot):</strong> no change</li>
                    <li><strong>Hard (red dot):</strong> next interval ×0.5</li>
                    <li className="mt-2">Use "Start Session" to review due problems one by one.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        <StudyPlan stats={stats} activity={activity} />

        <ActivityHeatmap activity={activity} streaks={streaks} />

        <CircularStatsCard
          stats={{
            total: stats.total,
            solved: stats.solved,
            easy: stats.easy,
            medium: stats.medium,
            hard: stats.hard,
            dueToday: getDueProblems(),
          }}
          problems={problems}
        />

        <ExportImportControls progress={progress} setProgress={setProgress} />

        <Filters
          categories={categories}
          difficulties={difficulties}
          filterCategory={filterCategory}
          setFilterCategory={setFilterCategory}
          filterDifficulty={filterDifficulty}
          setFilterDifficulty={setFilterDifficulty}
          showOnlyDueToday={showOnlyDueToday}
          setShowOnlyDueToday={setShowOnlyDueToday}
        />

        <ProblemTable
          problems={problems}
          progress={currentProgress}
          toggleComplete={toggleComplete}
          getReviewDueDates={getReviewDueDates}
          recordTime={recordTime}
          filterCategory={filterCategory}
          filterDifficulty={filterDifficulty}
          showOnlyDueToday={showOnlyDueToday}
        />
      </div>

      <DailySession
        isOpen={sessionOpen}
        onClose={() => setSessionOpen(false)}
        dueItems={dueItems}
        onReview={(problemId, reviewIndex, feeling) => {
          toggleComplete(problemId, reviewIndex, feeling);
        }}
      />
    </div>
  );
};

export default LeetCodeTracker;
