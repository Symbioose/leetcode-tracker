import { useState, useEffect, useCallback, useMemo } from "react";
import {
  KARPATHY_LESSONS,
  KARPATHY_TARGET_HOURS,
  CHIP_CHAPTERS,
  REWALK_PROJECTS,
  MINIDEVIN_PHASES,
  MINIDEVIN_TOTAL,
  PROFILE_ASSETS,
  NETWORK_CONTACTS,
  APPLICATIONS,
  ANKI_TOPICS,
  ANKI_TARGET_CARDS,
  PROGRESS_WEIGHTS,
  LEETCODE_GOAL,
} from "../data/internshipPrep";

const STORAGE_KEY = "internship-prep-v1";
const ACTIVITY_KEY = "activity-log";

const todayKey = () => {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
};

const nowIso = () => new Date().toISOString();

const blankState = () => ({
  // Each map: id → { done: bool }
  karpathy: { lessons: {}, hoursLogged: 0 },
  chipHuyen: { chapters: {} },
  codeRewalk: { projects: {} }, // id → { status, readmeUrl }
  minidevin: { tasks: {} },
  profile: { items: {} }, // id → { status }
  network: { contacts: {} }, // id → { status }
  applications: { items: {} }, // id → { status, referral }
  mocks: { entries: [] }, // [{ id, date, platform, type, outcome, notes }]
  anki: { cardsCreated: 0, reviewedToday: 0, reviewedDate: null, topics: {} },
  lastUpdated: {}, // section → ISO timestamp
});

const loadState = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return blankState();
    const parsed = JSON.parse(raw);
    return { ...blankState(), ...parsed };
  } catch {
    return blankState();
  }
};

// Bumps the activity-log (shared with LeetCode tracker) so the heatmap reflects this page too.
const bumpActivity = () => {
  try {
    const raw = localStorage.getItem(ACTIVITY_KEY);
    const log = raw ? JSON.parse(raw) : {};
    const today = todayKey();
    log[today] = (log[today] ?? 0) + 1;
    localStorage.setItem(ACTIVITY_KEY, JSON.stringify(log));
  } catch { /* ignore */ }
};

// Read leetcode-progress-v2 to feed the weighted overall progress.
// Schema is { "NeetCode 150": { [problemId]: { solved, ... } } }.
const readLeetcodeSolvedCount = () => {
  try {
    const raw = localStorage.getItem("leetcode-progress-v2");
    if (!raw) return 0;
    const parsed = JSON.parse(raw);
    const lists = parsed && typeof parsed === "object" ? Object.values(parsed) : [];
    let solved = 0;
    for (const list of lists) {
      if (!list || typeof list !== "object") continue;
      for (const prob of Object.values(list)) {
        if (prob && prob.solved) solved += 1;
      }
    }
    return solved;
  } catch {
    return 0;
  }
};

export const useInternshipPrep = () => {
  const [state, setState] = useState(loadState);
  const [leetcodeSolved, setLeetcodeSolved] = useState(readLeetcodeSolvedCount);

  // Persist and notify the Gist hook.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      window.dispatchEvent(new Event("local-data-changed"));
    } catch { /* ignore */ }
  }, [state]);

  // Pick up leetcode changes (same tab via storage event won't fire — re-read on focus).
  useEffect(() => {
    const refresh = () => setLeetcodeSolved(readLeetcodeSolvedCount());
    refresh();
    window.addEventListener("focus", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  // Reset reviewedToday when the day rolls over.
  useEffect(() => {
    const today = todayKey();
    if (state.anki?.reviewedDate && state.anki.reviewedDate !== today) {
      setState((prev) => ({
        ...prev,
        anki: { ...prev.anki, reviewedToday: 0, reviewedDate: today },
      }));
    }
  }, [state.anki?.reviewedDate]);

  const touch = useCallback((section, mutator) => {
    setState((prev) => {
      const next = mutator(prev);
      return {
        ...next,
        lastUpdated: { ...next.lastUpdated, [section]: nowIso() },
      };
    });
    bumpActivity();
  }, []);

  // ── Karpathy ────────────────────────────────────────────────────────────
  const toggleKarpathy = useCallback((id) => {
    touch("karpathy", (prev) => {
      const lessons = { ...prev.karpathy.lessons };
      lessons[id] = !lessons[id];
      return { ...prev, karpathy: { ...prev.karpathy, lessons } };
    });
  }, [touch]);

  const setKarpathyHours = useCallback((hours) => {
    const safe = Math.max(0, Math.min(999, Number(hours) || 0));
    touch("karpathy", (prev) => ({
      ...prev,
      karpathy: { ...prev.karpathy, hoursLogged: safe },
    }));
  }, [touch]);

  // ── Chip Huyen ──────────────────────────────────────────────────────────
  const toggleChip = useCallback((id) => {
    touch("chipHuyen", (prev) => {
      const chapters = { ...prev.chipHuyen.chapters };
      chapters[id] = !chapters[id];
      return { ...prev, chipHuyen: { ...prev.chipHuyen, chapters } };
    });
  }, [touch]);

  // ── Code Rewalk ─────────────────────────────────────────────────────────
  const setRewalkStatus = useCallback((id, status) => {
    touch("codeRewalk", (prev) => {
      const projects = { ...prev.codeRewalk.projects };
      projects[id] = { ...projects[id], status };
      return { ...prev, codeRewalk: { projects } };
    });
  }, [touch]);

  const setRewalkReadme = useCallback((id, url) => {
    touch("codeRewalk", (prev) => {
      const projects = { ...prev.codeRewalk.projects };
      projects[id] = { ...projects[id], readmeUrl: url };
      return { ...prev, codeRewalk: { projects } };
    });
  }, [touch]);

  // ── MiniDevin ───────────────────────────────────────────────────────────
  const toggleMiniDevin = useCallback((taskId) => {
    touch("minidevin", (prev) => {
      const tasks = { ...prev.minidevin.tasks };
      tasks[taskId] = !tasks[taskId];
      return { ...prev, minidevin: { tasks } };
    });
  }, [touch]);

  // ── Profile assets ──────────────────────────────────────────────────────
  const setProfileStatus = useCallback((id, status) => {
    touch("profile", (prev) => {
      const items = { ...prev.profile.items };
      items[id] = { ...items[id], status };
      return { ...prev, profile: { items } };
    });
  }, [touch]);

  // ── Network ─────────────────────────────────────────────────────────────
  const setContactStatus = useCallback((id, status) => {
    touch("network", (prev) => {
      const contacts = { ...prev.network.contacts };
      contacts[id] = { ...contacts[id], status };
      return { ...prev, network: { contacts } };
    });
  }, [touch]);

  // ── Applications ────────────────────────────────────────────────────────
  const setAppStatus = useCallback((id, status) => {
    touch("applications", (prev) => {
      const items = { ...prev.applications.items };
      items[id] = { ...items[id], status };
      return { ...prev, applications: { items } };
    });
  }, [touch]);

  const toggleAppReferral = useCallback((id) => {
    touch("applications", (prev) => {
      const items = { ...prev.applications.items };
      const cur = items[id] || {};
      items[id] = { ...cur, referral: !cur.referral };
      return { ...prev, applications: { items } };
    });
  }, [touch]);

  // ── Mock interviews ─────────────────────────────────────────────────────
  const addMock = useCallback((entry) => {
    const row = {
      id: `mock-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      date: entry.date || todayKey(),
      platform: entry.platform || "Pramp",
      type: entry.type || "DSA",
      outcome: entry.outcome || "",
      notes: entry.notes || "",
    };
    touch("mocks", (prev) => ({
      ...prev,
      mocks: { entries: [row, ...prev.mocks.entries] },
    }));
  }, [touch]);

  const removeMock = useCallback((id) => {
    touch("mocks", (prev) => ({
      ...prev,
      mocks: { entries: prev.mocks.entries.filter((e) => e.id !== id) },
    }));
  }, [touch]);

  // ── Anki ────────────────────────────────────────────────────────────────
  const setAnkiCardsCreated = useCallback((value) => {
    const safe = Math.max(0, Math.min(9999, Number(value) || 0));
    touch("anki", (prev) => ({
      ...prev,
      anki: { ...prev.anki, cardsCreated: safe },
    }));
  }, [touch]);

  const setAnkiReviewedToday = useCallback((value) => {
    const safe = Math.max(0, Math.min(9999, Number(value) || 0));
    touch("anki", (prev) => ({
      ...prev,
      anki: { ...prev.anki, reviewedToday: safe, reviewedDate: todayKey() },
    }));
  }, [touch]);

  const toggleAnkiTopic = useCallback((id) => {
    touch("anki", (prev) => {
      const topics = { ...prev.anki.topics };
      topics[id] = !topics[id];
      return { ...prev, anki: { ...prev.anki, topics } };
    });
  }, [touch]);

  // ── Derived counters ────────────────────────────────────────────────────
  const counts = useMemo(() => {
    const karpathyDone = KARPATHY_LESSONS.filter((l) => state.karpathy.lessons[l.id]).length;
    const chipDone = CHIP_CHAPTERS.filter((c) => state.chipHuyen.chapters[c.id]).length;
    const rewalkDone = REWALK_PROJECTS.filter(
      (p) => state.codeRewalk.projects[p.id]?.status === "Done",
    ).length;
    const minidevinDone = MINIDEVIN_PHASES.flatMap((p) => p.tasks)
      .filter((t) => state.minidevin.tasks[t.id]).length;
    const profileDone = PROFILE_ASSETS.filter(
      (a) => state.profile.items[a.id]?.status === "Done",
    ).length;
    const networkActivated = NETWORK_CONTACTS.filter((c) => {
      const s = state.network.contacts[c.id]?.status;
      return s && s !== "Not contacted";
    }).length;
    const appsSubmitted = APPLICATIONS.filter((a) => {
      const s = state.applications.items[a.id]?.status;
      return s && s !== "Not opened" && s !== "Opened";
    }).length;
    const ankiTopicsDone = ANKI_TOPICS.filter((t) => state.anki.topics[t.id]).length;

    return {
      karpathyDone,
      chipDone,
      rewalkDone,
      minidevinDone,
      profileDone,
      networkActivated,
      appsSubmitted,
      ankiTopicsDone,
    };
  }, [state]);

  const overallPercent = useMemo(() => {
    const w = PROGRESS_WEIGHTS;
    const ratio =
      w.leetcode     * Math.min(1, leetcodeSolved / LEETCODE_GOAL) +
      w.karpathy     * (counts.karpathyDone / KARPATHY_LESSONS.length) +
      w.chipHuyen    * (counts.chipDone / CHIP_CHAPTERS.length) +
      w.codeRewalk   * (counts.rewalkDone / REWALK_PROJECTS.length) +
      w.minidevin    * (counts.minidevinDone / MINIDEVIN_TOTAL) +
      w.profile      * (counts.profileDone / PROFILE_ASSETS.length) +
      w.network      * (counts.networkActivated / NETWORK_CONTACTS.length) +
      w.applications * Math.min(1, counts.appsSubmitted / 30);
    return Math.round(ratio * 1000) / 10;
  }, [counts, leetcodeSolved]);

  return {
    state,
    counts,
    leetcodeSolved,
    overallPercent,
    targets: {
      karpathyHoursTarget: KARPATHY_TARGET_HOURS,
      ankiTarget: ANKI_TARGET_CARDS,
    },
    actions: {
      toggleKarpathy,
      setKarpathyHours,
      toggleChip,
      setRewalkStatus,
      setRewalkReadme,
      toggleMiniDevin,
      setProfileStatus,
      setContactStatus,
      setAppStatus,
      toggleAppReferral,
      addMock,
      removeMock,
      setAnkiCardsCreated,
      setAnkiReviewedToday,
      toggleAnkiTopic,
    },
  };
};
