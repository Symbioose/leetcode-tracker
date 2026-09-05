import { useState, useMemo } from "react";
import {
  ChevronDown,
  ChevronRight,
  Calendar,
  Target,
  Flame,
  Briefcase,
  GraduationCap,
  BookOpen,
  Code2,
  Bot,
  User,
  Users,
  ClipboardList,
  MessageSquare,
  Layers,
  ExternalLink,
  Plus,
  Trash2,
} from "lucide-react";
import { useInternshipPrep } from "../hooks/useInternshipPrep";
import { useActivity } from "../hooks/useActivity";
import { useGistSync } from "../hooks/useGistSync";
import { GistSyncPanel } from "../components";
import {
  DEADLINE_READY,
  DEADLINE_FIRST_APP,
  KARPATHY_LESSONS,
  CHIP_CHAPTERS,
  REWALK_PROJECTS,
  REWALK_STATUSES,
  MINIDEVIN_PHASES,
  MINIDEVIN_TOTAL,
  PROFILE_ASSETS,
  PROFILE_STATUSES,
  NETWORK_CONTACTS,
  CONTACT_STATUSES,
  APPLICATIONS,
  APPLICATION_STATUSES,
  APPLICATIONS_TOTAL_GOAL,
  MOCK_PLATFORMS,
  MOCK_TYPES,
  ANKI_TOPICS,
  LEETCODE_GOAL,
} from "../data/internshipPrep";

const daysUntil = (isoDate) => {
  const target = new Date(`${isoDate}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((target - today) / 86400000);
};

const formatDate = (iso) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const formatTimestamp = (iso) => {
  if (!iso) return "Never updated";
  const d = new Date(iso);
  return `Updated ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })} · ${d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;
};

const statusColor = (status) => {
  switch (status) {
    case "Done":
    case "Offer":
    case "Referral confirmed":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300";
    case "In progress":
    case "Applied":
    case "Phone screen":
    case "Technical":
    case "Onsite":
    case "Response":
    case "Message sent":
    case "Opened":
      return "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300";
    case "Rejected":
      return "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300";
    default:
      return "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300";
  }
};

// ── Reusable bits ──────────────────────────────────────────────────────────
const ProgressBar = ({ value, max, accent = "blue" }) => {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const colorMap = {
    blue: "from-blue-500 to-indigo-500",
    green: "from-emerald-400 to-emerald-500",
    purple: "from-purple-500 to-pink-500",
    amber: "from-amber-400 to-orange-500",
  };
  return (
    <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
      <div
        className={`h-full rounded-full bg-gradient-to-r ${colorMap[accent]} transition-all`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
};

const Section = ({ icon: Icon, title, subtitle, count, total, lastUpdated, accent = "blue", defaultOpen = true, children }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          {open ? (
            <ChevronDown size={18} className="text-gray-400 flex-shrink-0" />
          ) : (
            <ChevronRight size={18} className="text-gray-400 flex-shrink-0" />
          )}
          <Icon size={18} className="text-gray-500 dark:text-gray-400 flex-shrink-0" />
          <div className="min-w-0">
            <h2 className="font-semibold text-gray-900 dark:text-white truncate">{title}</h2>
            {subtitle && (
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{subtitle}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {typeof count === "number" && typeof total === "number" && (
            <span className="text-sm tabular-nums text-gray-600 dark:text-gray-300">
              <span className="font-semibold">{count}</span>
              <span className="text-gray-400 dark:text-gray-500">/{total}</span>
            </span>
          )}
        </div>
      </button>
      {typeof count === "number" && typeof total === "number" && (
        <div className="px-5 pb-2">
          <ProgressBar value={count} max={total} accent={accent} />
        </div>
      )}
      {open && (
        <div className="px-5 pb-5 pt-2 border-t border-gray-100 dark:border-gray-700/60">
          {children}
          <p className="mt-4 text-[11px] text-gray-400 dark:text-gray-500">
            {formatTimestamp(lastUpdated)}
          </p>
        </div>
      )}
    </section>
  );
};

const Checkbox = ({ checked, onChange, label, sublabel }) => (
  <label className="flex items-start gap-3 cursor-pointer group select-none">
    <input
      type="checkbox"
      checked={!!checked}
      onChange={onChange}
      className="mt-0.5 h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
    />
    <span className="flex-1 min-w-0">
      <span className={`block text-sm ${checked ? "line-through text-gray-400 dark:text-gray-500" : "text-gray-800 dark:text-gray-100"}`}>
        {label}
      </span>
      {sublabel && (
        <span className="block text-xs text-gray-400 dark:text-gray-500 mt-0.5">{sublabel}</span>
      )}
    </span>
  </label>
);

const StatusPill = ({ value, options, onChange }) => (
  <select
    value={value || options[0]}
    onChange={(e) => onChange(e.target.value)}
    className={`text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer focus:ring-2 focus:ring-blue-500 ${statusColor(value || options[0])}`}
  >
    {options.map((opt) => (
      <option key={opt} value={opt}>
        {opt}
      </option>
    ))}
  </select>
);

// ── Sparkline — 30-day activity ────────────────────────────────────────────
const Sparkline = ({ activity }) => {
  const points = useMemo(() => {
    const arr = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = [
        d.getFullYear(),
        String(d.getMonth() + 1).padStart(2, "0"),
        String(d.getDate()).padStart(2, "0"),
      ].join("-");
      arr.push({ key, value: activity[key] ?? 0 });
    }
    return arr;
  }, [activity]);

  const max = Math.max(1, ...points.map((p) => p.value));
  const W = 600;
  const H = 60;
  const stepX = W / (points.length - 1);
  const path = points
    .map((p, i) => {
      const x = i * stepX;
      const y = H - (p.value / max) * (H - 6) - 3;
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
  const areaPath = `${path} L ${W} ${H} L 0 ${H} Z`;
  const total = points.reduce((a, b) => a + b.value, 0);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-800 dark:text-white">Last 30 days</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">{total} actions logged</p>
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-16">
        <defs>
          <linearGradient id="spark-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#spark-grad)" />
        <path d={path} fill="none" stroke="#3b82f6" strokeWidth="1.5" />
      </svg>
    </div>
  );
};

// ── Mock interviews — inline form ──────────────────────────────────────────
const MockForm = ({ onAdd }) => {
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [platform, setPlatform] = useState(MOCK_PLATFORMS[0]);
  const [type, setType] = useState(MOCK_TYPES[0]);
  const [outcome, setOutcome] = useState("");
  const [notes, setNotes] = useState("");

  const submit = (e) => {
    e.preventDefault();
    onAdd({ date, platform, type, outcome, notes });
    setOutcome("");
    setNotes("");
  };

  return (
    <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-6 gap-2 mb-4">
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="md:col-span-1 px-2 py-1.5 text-sm rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100"
      />
      <select
        value={platform}
        onChange={(e) => setPlatform(e.target.value)}
        className="md:col-span-1 px-2 py-1.5 text-sm rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100"
      >
        {MOCK_PLATFORMS.map((p) => <option key={p}>{p}</option>)}
      </select>
      <select
        value={type}
        onChange={(e) => setType(e.target.value)}
        className="md:col-span-1 px-2 py-1.5 text-sm rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100"
      >
        {MOCK_TYPES.map((t) => <option key={t}>{t}</option>)}
      </select>
      <input
        type="text"
        placeholder="Outcome"
        value={outcome}
        onChange={(e) => setOutcome(e.target.value)}
        className="md:col-span-1 px-2 py-1.5 text-sm rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100"
      />
      <input
        type="text"
        placeholder="Notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        className="md:col-span-1 px-2 py-1.5 text-sm rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100"
      />
      <button
        type="submit"
        className="md:col-span-1 px-3 py-1.5 text-sm rounded bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center justify-center gap-1"
      >
        <Plus size={14} /> Log
      </button>
    </form>
  );
};

// ── Main page ──────────────────────────────────────────────────────────────
const InternshipPrep = () => {
  const prep = useInternshipPrep();
  const { activity, streaks } = useActivity();
  const gistSync = useGistSync(prep.state, () => {});

  const daysToReady = daysUntil(DEADLINE_READY);
  const daysToFirstApp = daysUntil(DEADLINE_FIRST_APP);

  // Group applications by tier for nicer rendering.
  const appsByTier = useMemo(() => {
    const groups = {};
    APPLICATIONS.forEach((a) => {
      if (!groups[a.tier]) groups[a.tier] = [];
      groups[a.tier].push(a);
    });
    for (const tier of Object.keys(groups)) {
      groups[tier].sort((a, b) => a.deadline.localeCompare(b.deadline));
    }
    return groups;
  }, []);

  const { actions, state, counts, leetcodeSolved, overallPercent, targets } = prep;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 transition-colors">
      <div className="max-w-6xl mx-auto space-y-5">
        {/* ── Hero / summary ────────────────────────────────────────────── */}
        <header className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 sm:p-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div>
              <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">Internship prep</p>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mt-1">
                Big Tech / AI startups · US
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5">
                Parallel chantiers tracked alongside NeetCode 150.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 justify-start lg:justify-end">
              <div className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-200">
                <Flame size={18} className="text-orange-500" />
                <span className="font-bold tabular-nums">{streaks.current}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">day streak</span>
              </div>
              <GistSyncPanel {...gistSync} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-6">
            <div className="rounded-xl p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/20 border border-blue-100 dark:border-blue-900/40">
              <div className="flex items-center gap-2 text-xs font-medium text-blue-700 dark:text-blue-300 uppercase tracking-wide">
                <Calendar size={14} /> First app deadline
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-blue-700 dark:text-blue-300 tabular-nums">
                  {Math.max(0, daysToFirstApp)}
                </span>
                <span className="text-xs text-blue-600/80 dark:text-blue-300/80">
                  days · {formatDate(DEADLINE_FIRST_APP)}
                </span>
              </div>
              <p className="text-xs text-blue-700/70 dark:text-blue-300/70 mt-1">
                Première vague T1 US
              </p>
            </div>

            <div className="rounded-xl p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/20 border border-amber-100 dark:border-amber-900/40">
              <div className="flex items-center gap-2 text-xs font-medium text-amber-700 dark:text-amber-300 uppercase tracking-wide">
                <Target size={14} /> Ready by
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-amber-700 dark:text-amber-300 tabular-nums">
                  {Math.max(0, daysToReady)}
                </span>
                <span className="text-xs text-amber-600/80 dark:text-amber-300/80">
                  days · {formatDate(DEADLINE_READY)}
                </span>
              </div>
              <p className="text-xs text-amber-700/70 dark:text-amber-300/70 mt-1">Full readiness target</p>
            </div>

            <div className="rounded-xl p-4 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/20 border border-emerald-100 dark:border-emerald-900/40">
              <div className="flex items-center gap-2 text-xs font-medium text-emerald-700 dark:text-emerald-300 uppercase tracking-wide">
                <Layers size={14} /> Overall progress
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-emerald-700 dark:text-emerald-300 tabular-nums">
                  {overallPercent}%
                </span>
              </div>
              <div className="mt-2">
                <ProgressBar value={overallPercent} max={100} accent="green" />
              </div>
              <p className="text-xs text-emerald-700/70 dark:text-emerald-300/70 mt-1">Weighted across all chantiers</p>
            </div>
          </div>
        </header>

        {/* ── Sparkline ─────────────────────────────────────────────────── */}
        <Sparkline activity={activity} />

        {/* ── 1. Karpathy ───────────────────────────────────────────────── */}
        <Section
          icon={GraduationCap}
          title='Karpathy — "Neural Networks: Zero to Hero"'
          subtitle={`Hours logged: ${state.karpathy.hoursLogged} / ${targets.karpathyHoursTarget}h target`}
          count={counts.karpathyDone}
          total={KARPATHY_LESSONS.length}
          lastUpdated={state.lastUpdated.karpathy}
          accent="purple"
        >
          <ul className="space-y-2.5">
            {KARPATHY_LESSONS.map((lesson, i) => (
              <li key={lesson.id}>
                <Checkbox
                  checked={state.karpathy.lessons[lesson.id]}
                  onChange={() => actions.toggleKarpathy(lesson.id)}
                  label={`${i + 1}. ${lesson.title}`}
                  sublabel={`${lesson.hours}h`}
                />
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-center gap-2">
            <label className="text-xs text-gray-500 dark:text-gray-400">Hours logged:</label>
            <input
              type="number"
              min="0"
              step="0.5"
              value={state.karpathy.hoursLogged}
              onChange={(e) => actions.setKarpathyHours(e.target.value)}
              className="w-24 px-2 py-1 text-sm rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100"
            />
            <span className="text-xs text-gray-400 dark:text-gray-500">/ {targets.karpathyHoursTarget}h</span>
          </div>
        </Section>

        {/* ── 2. Chip Huyen ─────────────────────────────────────────────── */}
        <Section
          icon={BookOpen}
          title='Chip Huyen — "Designing ML Systems"'
          subtitle="Targeted chapters"
          count={counts.chipDone}
          total={CHIP_CHAPTERS.length}
          lastUpdated={state.lastUpdated.chipHuyen}
        >
          <ul className="space-y-2.5">
            {CHIP_CHAPTERS.map((ch) => (
              <li key={ch.id}>
                <Checkbox
                  checked={state.chipHuyen.chapters[ch.id]}
                  onChange={() => actions.toggleChip(ch.id)}
                  label={ch.title}
                />
              </li>
            ))}
          </ul>
        </Section>

        {/* ── 3. Code Rewalk ────────────────────────────────────────────── */}
        <Section
          icon={Code2}
          title="Code Rewalk — Projects Self-Mastery"
          subtitle="2-page technical README per project (no AI)"
          count={counts.rewalkDone}
          total={REWALK_PROJECTS.length}
          lastUpdated={state.lastUpdated.codeRewalk}
          accent="amber"
        >
          <ul className="space-y-3">
            {REWALK_PROJECTS.map((p) => {
              const entry = state.codeRewalk.projects[p.id] || {};
              return (
                <li
                  key={p.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/40"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{p.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{p.context}</p>
                  </div>
                  <input
                    type="url"
                    placeholder="README URL"
                    value={entry.readmeUrl || ""}
                    onChange={(e) => actions.setRewalkReadme(p.id, e.target.value)}
                    className="text-xs px-2 py-1 w-full sm:w-48 rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100"
                  />
                  {entry.readmeUrl && (
                    <a
                      href={entry.readmeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline text-xs flex items-center gap-1"
                    >
                      Open <ExternalLink size={12} />
                    </a>
                  )}
                  <StatusPill
                    value={entry.status}
                    options={REWALK_STATUSES}
                    onChange={(v) => actions.setRewalkStatus(p.id, v)}
                  />
                </li>
              );
            })}
          </ul>
        </Section>

        {/* ── 4. MiniDevin ──────────────────────────────────────────────── */}
        <Section
          icon={Bot}
          title="MiniDevin — Centerpiece Project"
          subtitle="3 phases, end-of-month targets"
          count={counts.minidevinDone}
          total={MINIDEVIN_TOTAL}
          lastUpdated={state.lastUpdated.minidevin}
          accent="purple"
        >
          <div className="space-y-5">
            {MINIDEVIN_PHASES.map((phase) => {
              const done = phase.tasks.filter((t) => state.minidevin.tasks[t.id]).length;
              return (
                <div key={phase.id} className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{phase.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Target: {phase.target}</p>
                    </div>
                    <span className="text-xs tabular-nums text-gray-600 dark:text-gray-300">
                      <span className="font-semibold">{done}</span>/{phase.tasks.length}
                    </span>
                  </div>
                  <div className="mb-3">
                    <ProgressBar value={done} max={phase.tasks.length} accent="purple" />
                  </div>
                  <ul className="space-y-2">
                    {phase.tasks.map((t) => (
                      <li key={t.id}>
                        <Checkbox
                          checked={state.minidevin.tasks[t.id]}
                          onChange={() => actions.toggleMiniDevin(t.id)}
                          label={t.title}
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </Section>

        {/* ── 5. Profile Assets ─────────────────────────────────────────── */}
        <Section
          icon={User}
          title="Profile Assets"
          subtitle="CV, LinkedIn, GitHub, portfolio"
          count={counts.profileDone}
          total={PROFILE_ASSETS.length}
          lastUpdated={state.lastUpdated.profile}
        >
          <ul className="space-y-3">
            {PROFILE_ASSETS.map((a) => {
              const entry = state.profile.items[a.id] || {};
              return (
                <li
                  key={a.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/40"
                >
                  <span className="text-sm text-gray-800 dark:text-gray-100">{a.title}</span>
                  <StatusPill
                    value={entry.status}
                    options={PROFILE_STATUSES}
                    onChange={(v) => actions.setProfileStatus(a.id, v)}
                  />
                </li>
              );
            })}
          </ul>
        </Section>

        {/* ── 6. Network ────────────────────────────────────────────────── */}
        <Section
          icon={Users}
          title="Network Activation"
          subtitle="Warm contacts + outreach"
          count={counts.networkActivated}
          total={NETWORK_CONTACTS.length}
          lastUpdated={state.lastUpdated.network}
          accent="green"
        >
          <ul className="space-y-3">
            {NETWORK_CONTACTS.map((c) => {
              const entry = state.network.contacts[c.id] || {};
              return (
                <li
                  key={c.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/40"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{c.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{c.ctx}</p>
                  </div>
                  <StatusPill
                    value={entry.status}
                    options={CONTACT_STATUSES}
                    onChange={(v) => actions.setContactStatus(c.id, v)}
                  />
                </li>
              );
            })}
          </ul>
        </Section>

        {/* ── 7. Applications ───────────────────────────────────────────── */}
        <Section
          icon={Briefcase}
          title="Applications Pipeline"
          subtitle={`${counts.appsSubmitted} submitted / ${APPLICATIONS_TOTAL_GOAL} target`}
          count={counts.appsSubmitted}
          total={APPLICATIONS_TOTAL_GOAL}
          lastUpdated={state.lastUpdated.applications}
          accent="blue"
        >
          <div className="space-y-5">
            {Object.entries(appsByTier).map(([tier, apps]) => (
              <div key={tier}>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
                  {tier}
                </h3>
                <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700/40 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium">Company</th>
                        <th className="px-3 py-2 text-left font-medium">Role</th>
                        <th className="px-3 py-2 text-left font-medium">Location</th>
                        <th className="px-3 py-2 text-left font-medium">Deadline</th>
                        <th className="px-3 py-2 text-left font-medium">Status</th>
                        <th className="px-3 py-2 text-center font-medium">Ref?</th>
                      </tr>
                    </thead>
                    <tbody>
                      {apps.map((a) => {
                        const entry = state.applications.items[a.id] || {};
                        return (
                          <tr
                            key={a.id}
                            className="border-t border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30"
                          >
                            <td className="px-3 py-2 font-medium text-gray-900 dark:text-white">{a.company}</td>
                            <td className="px-3 py-2 text-gray-700 dark:text-gray-200">{a.role}</td>
                            <td className="px-3 py-2 text-gray-600 dark:text-gray-300 text-xs">{a.location}</td>
                            <td className="px-3 py-2 text-gray-600 dark:text-gray-300 text-xs whitespace-nowrap">
                              {formatDate(a.deadline)}
                            </td>
                            <td className="px-3 py-2">
                              <StatusPill
                                value={entry.status}
                                options={APPLICATION_STATUSES}
                                onChange={(v) => actions.setAppStatus(a.id, v)}
                              />
                            </td>
                            <td className="px-3 py-2 text-center">
                              <input
                                type="checkbox"
                                checked={!!entry.referral}
                                onChange={() => actions.toggleAppReferral(a.id)}
                                className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* ── 8. Mock interviews ────────────────────────────────────────── */}
        <Section
          icon={MessageSquare}
          title="Mock Interviews Log"
          subtitle="Target: 2/week à partir du rush final (25 août)"
          lastUpdated={state.lastUpdated.mocks}
          defaultOpen={true}
        >
          <MockForm onAdd={actions.addMock} />
          {state.mocks.entries.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 italic">No mocks logged yet.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700/40 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Date</th>
                    <th className="px-3 py-2 text-left font-medium">Platform</th>
                    <th className="px-3 py-2 text-left font-medium">Type</th>
                    <th className="px-3 py-2 text-left font-medium">Outcome</th>
                    <th className="px-3 py-2 text-left font-medium">Notes</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {state.mocks.entries.map((m) => (
                    <tr key={m.id} className="border-t border-gray-100 dark:border-gray-700/50">
                      <td className="px-3 py-2 text-gray-700 dark:text-gray-200 whitespace-nowrap">{m.date}</td>
                      <td className="px-3 py-2 text-gray-700 dark:text-gray-200">{m.platform}</td>
                      <td className="px-3 py-2 text-gray-700 dark:text-gray-200">{m.type}</td>
                      <td className="px-3 py-2 text-gray-700 dark:text-gray-200">{m.outcome || "—"}</td>
                      <td className="px-3 py-2 text-gray-600 dark:text-gray-300 text-xs max-w-xs truncate" title={m.notes}>
                        {m.notes || "—"}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          onClick={() => actions.removeMock(m.id)}
                          className="text-gray-400 hover:text-rose-500"
                          aria-label="Delete entry"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>

        {/* ── 9. ML Breadth Anki ────────────────────────────────────────── */}
        <Section
          icon={ClipboardList}
          title="ML Breadth Anki Deck"
          subtitle={`${state.anki.cardsCreated} / ${targets.ankiTarget} cards · ${state.anki.reviewedToday} reviewed today`}
          count={counts.ankiTopicsDone}
          total={ANKI_TOPICS.length}
          lastUpdated={state.lastUpdated.anki}
          accent="amber"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="rounded-lg p-3 bg-gray-50 dark:bg-gray-700/40">
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Cards created</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  value={state.anki.cardsCreated}
                  onChange={(e) => actions.setAnkiCardsCreated(e.target.value)}
                  className="w-24 px-2 py-1 text-sm rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100"
                />
                <span className="text-xs text-gray-400 dark:text-gray-500">/ {targets.ankiTarget}</span>
              </div>
              <div className="mt-2">
                <ProgressBar value={state.anki.cardsCreated} max={targets.ankiTarget} accent="amber" />
              </div>
            </div>
            <div className="rounded-lg p-3 bg-gray-50 dark:bg-gray-700/40">
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Reviewed today</label>
              <input
                type="number"
                min="0"
                value={state.anki.reviewedToday}
                onChange={(e) => actions.setAnkiReviewedToday(e.target.value)}
                className="w-24 px-2 py-1 text-sm rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100"
              />
            </div>
          </div>
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">Topics covered</p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {ANKI_TOPICS.map((t) => (
              <li key={t.id}>
                <Checkbox
                  checked={state.anki.topics[t.id]}
                  onChange={() => actions.toggleAnkiTopic(t.id)}
                  label={t.title}
                />
              </li>
            ))}
          </ul>
        </Section>

        {/* ── LeetCode anchor ───────────────────────────────────────────── */}
        <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 p-5 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            LeetCode counts toward this score:{" "}
            <span className="font-semibold tabular-nums">{leetcodeSolved}</span>
            <span className="text-gray-400 dark:text-gray-500"> / {LEETCODE_GOAL}</span>{" "}
            <a href="/" className="text-blue-600 dark:text-blue-400 hover:underline">→ open tracker</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default InternshipPrep;
