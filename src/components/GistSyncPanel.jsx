import { useState } from 'react';
import { Cloud, CloudOff, RefreshCw, Upload, Download, Eye, EyeOff, ExternalLink, X, CheckCircle, AlertCircle, Loader } from 'lucide-react';

const formatSyncTime = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) +
    ' · ' + d.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const StatusIcon = ({ status }) => {
  if (status === 'syncing') return <Loader size={14} className="animate-spin text-blue-500" />;
  if (status === 'success') return <CheckCircle size={14} className="text-green-500" />;
  if (status === 'error') return <AlertCircle size={14} className="text-red-500" />;
  return null;
};

const GistSyncPanel = ({ token, saveToken, gistId, push, pull, disconnect, status, lastSync, syncError }) => {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(token);
  const [showToken, setShowToken] = useState(false);

  const isConnected = !!token;

  const handleConnect = () => {
    const t = draft.trim();
    if (!t) return;
    saveToken(t);
    push(t, undefined);
  };

  return (
    <div className="relative">
      {/* Trigger button */}
      <button
        onClick={() => setOpen((o) => !o)}
        title={isConnected ? 'Cloud sync active' : 'Set up cloud sync'}
        className={`flex items-center gap-1.5 px-3 py-2 rounded border text-sm font-medium transition-colors ${
          isConnected
            ? 'border-green-400 dark:border-green-600 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30'
            : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
        }`}
      >
        {isConnected ? <Cloud size={16} /> : <CloudOff size={16} />}
        <span className="hidden sm:inline">{isConnected ? 'Synced' : 'Sync'}</span>
        <StatusIcon status={status} />
      </button>

      {/* Panel */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800 dark:text-white text-sm">GitHub Gist Sync</h3>
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
              <X size={16} />
            </button>
          </div>

          {!isConnected ? (
            <>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                Sauvegarde automatique dans un Gist privé. Tes données survivent à tout clear de cache.
              </p>

              {/* Token input */}
              <div className="relative mb-2">
                <input
                  type={showToken ? 'text' : 'password'}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxx"
                  className="w-full pr-9 pl-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
                <button
                  onClick={() => setShowToken((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  {showToken ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>

              <button
                onClick={handleConnect}
                disabled={!draft.trim()}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white text-sm font-semibold rounded-lg transition-colors mb-3"
              >
                Connect & Backup
              </button>

              <a
                href="https://github.com/settings/tokens"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                <ExternalLink size={11} />
                github.com/settings/tokens → Tokens (classic) → scope: gist
              </a>

              {syncError && (
                <p className="mt-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded p-2">
                  {syncError}
                </p>
              )}
            </>
          ) : (
            <>
              {/* Connected state */}
              <div className="flex items-center gap-2 mb-3 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
                <div className="text-xs text-green-700 dark:text-green-400 min-w-0">
                  <div className="font-semibold">Connecté</div>
                  {lastSync && <div className="truncate text-green-600 dark:text-green-500">Synced {formatSyncTime(lastSync)}</div>}
                  {gistId && (
                    <a
                      href={`https://gist.github.com/${gistId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-0.5 hover:underline mt-0.5"
                    >
                      Voir le Gist <ExternalLink size={10} />
                    </a>
                  )}
                </div>
              </div>

              {syncError && (
                <p className="mb-3 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded p-2">
                  {syncError}
                </p>
              )}

              <div className="grid grid-cols-2 gap-2 mb-3">
                <button
                  onClick={() => push()}
                  disabled={status === 'syncing'}
                  className="flex items-center justify-center gap-1.5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  <Upload size={13} />
                  Push
                </button>
                <button
                  onClick={pull}
                  disabled={status === 'syncing' || !gistId}
                  className="flex items-center justify-center gap-1.5 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 text-gray-700 dark:text-gray-300 text-xs font-semibold rounded-lg transition-colors"
                >
                  <Download size={13} />
                  Pull
                </button>
              </div>

              <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-3 text-center">
                Auto-sync toutes les 12s quand tu travailles
              </p>

              <button
                onClick={disconnect}
                className="w-full py-1.5 text-xs text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors flex items-center justify-center gap-1"
              >
                <CloudOff size={12} /> Déconnecter
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default GistSyncPanel;
