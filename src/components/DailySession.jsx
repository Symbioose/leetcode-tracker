import { useState } from 'react';
import { X, ExternalLink, ChevronRight, Trophy } from 'lucide-react';

const DIFFICULTY_COLOR = {
  Easy: 'text-green-600 dark:text-green-400',
  Medium: 'text-yellow-600 dark:text-yellow-400',
  Hard: 'text-red-600 dark:text-red-400',
};

// Separate inner component so state resets each time the modal opens
const SessionContent = ({ dueItems, onReview, onClose }) => {
  const [queue, setQueue] = useState(() => [...dueItems]);
  const [reviewedCount, setReviewedCount] = useState(0);
  const total = dueItems.length;
  const isFinished = queue.length === 0;
  const current = queue[0] ?? null;

  const handleReview = (feeling) => {
    onReview(current.problem.id, current.reviewIndex, feeling);
    setReviewedCount((c) => c + 1);
    setQueue((prev) => prev.slice(1));
  };

  const handleSkip = () => {
    setQueue((prev) => [...prev.slice(1), prev[0]]);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white">
            Today&apos;s Session
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Progress bar */}
        <div className="px-5 pt-4">
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1.5">
            <span>{reviewedCount} / {total} reviewed</span>
            <span>{queue.length} remaining</span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-2 bg-green-500 rounded-full transition-all duration-300"
              style={{ width: `${total ? (reviewedCount / total) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Finished state */}
        {isFinished ? (
          <div className="px-5 py-10 text-center">
            <Trophy className="mx-auto mb-3 text-yellow-500" size={48} />
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
              Session complete!
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              You reviewed {reviewedCount} problem{reviewedCount !== 1 ? 's' : ''} today.
            </p>
            <button
              onClick={onClose}
              className="px-8 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
            >
              Done
            </button>
          </div>
        ) : current ? (
          <div className="px-5 py-6">
            {/* Review label */}
            <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
              Review R{current.reviewIndex + 1}
            </div>

            {/* Problem title */}
            <a
              href={current.problem.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-2 text-lg font-bold text-blue-600 dark:text-blue-400 hover:underline mb-1 group"
            >
              <span>{current.problem.title}</span>
              <ExternalLink size={16} className="flex-shrink-0 mt-1 opacity-60 group-hover:opacity-100" />
            </a>
            <span className={`text-sm font-semibold ${DIFFICULTY_COLOR[current.problem.difficulty]}`}>
              {current.problem.difficulty}
            </span>

            {/* Feeling buttons */}
            <div className="mt-7">
              <p className="text-sm text-center text-gray-500 dark:text-gray-400 mb-3">
                Solve it, then rate how it felt:
              </p>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => handleReview('hard')}
                  className="py-3 rounded-xl border-2 border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 font-bold hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                >
                  Hard
                </button>
                <button
                  onClick={() => handleReview('medium')}
                  className="py-3 rounded-xl border-2 border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 font-bold hover:bg-yellow-100 dark:hover:bg-yellow-900/40 transition-colors"
                >
                  Medium
                </button>
                <button
                  onClick={() => handleReview('easy')}
                  className="py-3 rounded-xl border-2 border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 font-bold hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors"
                >
                  Easy
                </button>
              </div>
            </div>

            {/* Skip */}
            {queue.length > 1 && (
              <button
                onClick={handleSkip}
                className="mt-4 w-full py-2 text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 flex items-center justify-center gap-1 transition-colors"
              >
                Skip for now <ChevronRight size={14} />
              </button>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
};

const DailySession = ({ isOpen, onClose, dueItems, onReview }) => {
  if (!isOpen || dueItems.length === 0) return null;
  return <SessionContent dueItems={dueItems} onReview={onReview} onClose={onClose} />;
};

export default DailySession;
