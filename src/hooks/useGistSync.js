import { useState, useEffect, useRef, useCallback } from 'react';

const FILENAME = 'leetcode-tracker-backup.json';
const GIST_API = 'https://api.github.com/gists';

// All localStorage keys that get backed up to the Gist.
const SYNC_KEYS = [
  'leetcode-progress-v2',
  'daily-challenge-v1',
  'activity-log',
];

const ls = {
  get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch { } },
  del: (k) => { try { localStorage.removeItem(k); } catch { } },
};

const buildBlob = () => {
  const data = {};
  for (const k of SYNC_KEYS) {
    const raw = ls.get(k);
    if (raw == null) continue;
    try { data[k] = JSON.parse(raw); } catch { /* skip non-JSON */ }
  }
  return { version: 2, data };
};

const applyBlob = (blob) => {
  if (blob && blob.version === 2 && blob.data) {
    for (const [k, v] of Object.entries(blob.data)) {
      ls.set(k, JSON.stringify(v));
    }
    return;
  }
  // Legacy backups stored just the progress object.
  if (blob && typeof blob === 'object') {
    ls.set('leetcode-progress-v2', JSON.stringify(blob));
  }
};

export const useGistSync = (progress, setProgress) => {
  const [token, setTokenState] = useState(() => ls.get('gist-token') || '');
  const [gistId, setGistIdState] = useState(() => ls.get('gist-id') || '');
  const [status, setStatus] = useState('idle');
  const [lastSync, setLastSync] = useState(() => ls.get('gist-last-sync') || null);
  const [syncError, setSyncError] = useState(null);
  const debounceRef = useRef(null);

  const saveToken = useCallback((t) => {
    setTokenState(t);
    if (t) ls.set('gist-token', t);
    else ls.del('gist-token');
  }, []);

  const headers = useCallback((t = token) => ({
    Authorization: `Bearer ${t}`,
    'Content-Type': 'application/json',
    Accept: 'application/vnd.github+json',
  }), [token]);

  const push = useCallback(async (overrideToken, overrideGistId) => {
    const tok = overrideToken ?? token;
    const gid = overrideGistId ?? gistId;
    if (!tok) return;

    setStatus('syncing');
    setSyncError(null);

    try {
      const content = JSON.stringify(buildBlob(), null, 2);
      let id = gid;

      if (!id) {
        const res = await fetch(GIST_API, {
          method: 'POST',
          headers: headers(tok),
          body: JSON.stringify({
            description: 'LeetCode Tracker — auto backup',
            public: false,
            files: { [FILENAME]: { content } },
          }),
        });
        if (!res.ok) throw new Error(`GitHub ${res.status}: ${await res.text()}`);
        const data = await res.json();
        id = data.id;
        setGistIdState(id);
        ls.set('gist-id', id);
      } else {
        const res = await fetch(`${GIST_API}/${id}`, {
          method: 'PATCH',
          headers: headers(tok),
          body: JSON.stringify({ files: { [FILENAME]: { content } } }),
        });
        if (!res.ok) throw new Error(`GitHub ${res.status}: ${await res.text()}`);
      }

      const ts = new Date().toISOString();
      setLastSync(ts);
      ls.set('gist-last-sync', ts);
      setStatus('success');
    } catch (e) {
      setStatus('error');
      setSyncError(e.message);
    }
  }, [token, gistId, headers]);

  const pull = useCallback(async () => {
    if (!token || !gistId) return;
    setStatus('syncing');
    setSyncError(null);

    try {
      const res = await fetch(`${GIST_API}/${gistId}`, { headers: headers() });
      if (!res.ok) throw new Error(`GitHub ${res.status}: ${await res.text()}`);
      const data = await res.json();
      const content = data.files?.[FILENAME]?.content;
      if (!content) throw new Error('Backup file not found in Gist');

      const blob = JSON.parse(content);
      applyBlob(blob);

      const ts = new Date().toISOString();
      setLastSync(ts);
      ls.set('gist-last-sync', ts);
      setStatus('success');

      // Reload so every hook re-reads localStorage with the restored state.
      // Defer slightly so the user sees the success state before the reload.
      setTimeout(() => window.location.reload(), 350);
    } catch (e) {
      setStatus('error');
      setSyncError(e.message);
    }
  }, [token, gistId, headers]);

  const disconnect = useCallback(() => {
    saveToken('');
    setGistIdState('');
    ls.del('gist-id');
    ls.del('gist-last-sync');
    setStatus('idle');
    setSyncError(null);
    setLastSync(null);
  }, [saveToken]);

  // Auto-push: debounce 12s after any change. Triggers on `progress` updates
  // and on a `local-data-changed` event fired by sibling hooks (e.g. useDailyChallenge).
  useEffect(() => {
    if (!token) return;

    const schedule = () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => push(), 12000);
    };

    schedule();
    const onLocalChange = () => schedule();
    window.addEventListener('local-data-changed', onLocalChange);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      window.removeEventListener('local-data-changed', onLocalChange);
    };
  }, [progress, token, push]);

  return { token, saveToken, gistId, push, pull, disconnect, status, lastSync, syncError };
};
