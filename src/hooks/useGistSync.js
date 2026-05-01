import { useState, useEffect, useRef, useCallback } from 'react';

const FILENAME = 'leetcode-tracker-backup.json';
const GIST_API = 'https://api.github.com/gists';

const ls = {
  get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch { } },
  del: (k) => { try { localStorage.removeItem(k); } catch { } },
};

export const useGistSync = (progress, setProgress) => {
  const [token, setTokenState] = useState(() => ls.get('gist-token') || '');
  const [gistId, setGistIdState] = useState(() => ls.get('gist-id') || '');
  const [status, setStatus] = useState('idle'); // idle | syncing | success | error
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
      const content = JSON.stringify(progress, null, 2);
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
  }, [token, gistId, progress, headers]);

  const pull = useCallback(async () => {
    if (!token || !gistId) return;
    setStatus('syncing');
    setSyncError(null);

    try {
      const res = await fetch(`${GIST_API}/${gistId}`, {
        headers: headers(),
      });
      if (!res.ok) throw new Error(`GitHub ${res.status}: ${await res.text()}`);
      const data = await res.json();
      const content = data.files?.[FILENAME]?.content;
      if (!content) throw new Error('Backup file not found in Gist');
      setProgress(JSON.parse(content));

      const ts = new Date().toISOString();
      setLastSync(ts);
      ls.set('gist-last-sync', ts);
      setStatus('success');
    } catch (e) {
      setStatus('error');
      setSyncError(e.message);
    }
  }, [token, gistId, setProgress, headers]);

  const disconnect = useCallback(() => {
    saveToken('');
    setGistIdState('');
    ls.del('gist-id');
    ls.del('gist-last-sync');
    setStatus('idle');
    setSyncError(null);
    setLastSync(null);
  }, [saveToken]);

  // Auto-push on progress changes, debounced 12s
  useEffect(() => {
    if (!token) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => push(), 12000);
    return () => clearTimeout(debounceRef.current);
  }, [progress, token, push]);

  return { token, saveToken, gistId, push, pull, disconnect, status, lastSync, syncError };
};
