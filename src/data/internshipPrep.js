// Static blueprint for the internship prep tracker.
// Mutable state lives in localStorage under 'internship-prep-v1' (see useInternshipPrep).

// Re-planned July 15, 2026: readiness aligned with the study-plan target
// (see src/data/studyPlan.js), applications cascade Sept → Nov.
export const DEADLINE_READY = "2026-09-15";
export const DEADLINE_FIRST_APP = "2026-09-01";

export const KARPATHY_LESSONS = [
  { id: "k1", title: "Building Micrograd", hours: 2.5 },
  { id: "k2", title: "Bigram Language Model — Makemore Part 1", hours: 2 },
  { id: "k3", title: "MLP — Makemore Part 2", hours: 2 },
  { id: "k4", title: "Activations & Gradients, BatchNorm — Makemore Part 3", hours: 2 },
  { id: "k5", title: "Backprop Ninja — Makemore Part 4", hours: 2 },
  { id: "k6", title: "WaveNet — Makemore Part 5", hours: 2.5 },
  { id: "k7", title: "Building GPT from Scratch", hours: 2 },
  { id: "k8", title: "GPT-2 Reproduction", hours: 3 },
];
export const KARPATHY_TARGET_HOURS = 18;

export const CHIP_CHAPTERS = [
  { id: "c1", title: "Chapter 1: Overview of ML Systems" },
  { id: "c2", title: "Chapter 2: Introduction to ML Systems Design" },
  { id: "c4", title: "Chapter 4: Training Data" },
  { id: "c6", title: "Chapter 6: Model Development and Offline Evaluation" },
  { id: "c7", title: "Chapter 7: Model Deployment and Prediction Service" },
  { id: "c8", title: "Chapter 8: Data Distribution Shifts and Monitoring" },
];

export const REWALK_PROJECTS = [
  { id: "r-alan",   name: "Alan Context",  context: "Alan × Mistral hackathon" },
  { id: "r-claw",   name: "Claw4HR",       context: "HrFlow" },
  { id: "r-yougot", name: "YouGotIt",      context: "Mistral Worldwide" },
  { id: "r-brain",  name: "BrainReach",    context: "Project Europe" },
];

export const MINIDEVIN_PHASES = [
  {
    id: "mp1",
    title: "Phase 1 — Minimal agent loop from scratch",
    target: "End of September",
    tasks: [
      { id: "mp1-1", title: "Repo setup, basic structure" },
      { id: "mp1-2", title: "LLM call wrapper" },
      { id: "mp1-3", title: "Tool calling parser" },
      { id: "mp1-4", title: "Bash/file tool implementations" },
      { id: "mp1-5", title: "Observation → action loop" },
      { id: "mp1-6", title: "First end-to-end demo" },
    ],
  },
  {
    id: "mp2",
    title: "Phase 2 — Replicate OSS agent patterns",
    target: "End of November",
    tasks: [
      { id: "mp2-1", title: "Read & analyze browser-use codebase" },
      { id: "mp2-2", title: "Read & analyze OpenHands codebase" },
      { id: "mp2-3", title: "Implement memory management" },
      { id: "mp2-4", title: "Implement planning module" },
      { id: "mp2-5", title: "Implement multi-step reasoning" },
      { id: "mp2-6", title: "Error handling & retries" },
    ],
  },
  {
    id: "mp3",
    title: "Phase 3 — Original system",
    target: "End of December",
    tasks: [
      { id: "mp3-1", title: "Identify unique angle" },
      { id: "mp3-2", title: "Build differentiator" },
      { id: "mp3-3", title: "Write technical blog post" },
      { id: "mp3-4", title: "Publish repo publicly with clean README" },
      { id: "mp3-5", title: "Promote on X/LinkedIn" },
    ],
  },
];

export const MINIDEVIN_TOTAL = MINIDEVIN_PHASES.reduce(
  (n, p) => n + p.tasks.length,
  0,
);

export const PROFILE_ASSETS = [
  { id: "pa1", title: "CV reformatted to US standard (1-page, action verbs, no photo)" },
  { id: "pa2", title: "LinkedIn switched to English + pro headline" },
  { id: "pa3", title: "LinkedIn featured posts pinned (hackathon wins)" },
  { id: "pa4", title: "GitHub profile README updated" },
  { id: "pa5", title: "All hackathon projects in public repos with clean READMEs" },
  { id: "pa6", title: "Personal website / portfolio updated" },
];

export const NETWORK_CONTACTS = [
  { id: "n1", name: "Bob Deforce",        ctx: "Anthropic EMEA — Anthropic Londres/Dublin/SF" },
  { id: "n2", name: "Martin Natale",      ctx: "Apple — referral + visa insights" },
  { id: "n3", name: "Clémentine Gazay",   ctx: "XAnge — SF founder connections" },
  { id: "n4", name: "Guust Goossens",     ctx: "US contacts via Project Europe" },
  { id: "n5", name: "Thomas Rolf",        ctx: "Alan — SF founders network" },
  { id: "n6", name: "EPITA alumni search", ctx: "Target: 10 contacts at FAANG/top startups US" },
];

export const CONTACT_STATUSES = [
  "Not contacted",
  "Message sent",
  "Response",
  "Referral confirmed",
];

export const APPLICATION_STATUSES = [
  "Not opened",
  "Opened",
  "Applied",
  "Phone screen",
  "Technical",
  "Onsite",
  "Offer",
  "Rejected",
];

export const REWALK_STATUSES = ["Not started", "In progress", "Done"];
export const PROFILE_STATUSES = ["Not started", "In progress", "Done"];

export const APPLICATIONS = [
  // Tier 1 — US direct (first wave: applications go out as soon as the rush starts)
  { id: "app-amazon",     tier: "T1 US direct",   company: "Amazon",       role: "Applied Scientist Intern",     location: "SF/NYC/Seattle",   deadline: "2026-09-01" },
  { id: "app-google",     tier: "T1 US direct",   company: "Google",       role: "Research/SWE/MLE Intern",      location: "MTV/NYC/SF",       deadline: "2026-09-01" },
  { id: "app-msft",       tier: "T1 US direct",   company: "Microsoft",    role: "AI/ML Intern",                 location: "Redmond/NYC/SF",   deadline: "2026-09-01" },
  { id: "app-nvidia",     tier: "T1 US direct",   company: "NVIDIA",       role: "Deep Learning Intern",         location: "Santa Clara",      deadline: "2026-09-01" },

  // Tier 1 — US AI startups
  { id: "app-anthropic-sf",   tier: "T1 US AI startups", company: "Anthropic",    role: "Intern",              location: "SF",            deadline: "2026-09-15" },
  { id: "app-scale",      tier: "T1 US AI startups", company: "Scale AI",     role: "Intern",                  location: "SF",            deadline: "2026-09-15" },
  { id: "app-perplexity", tier: "T1 US AI startups", company: "Perplexity",   role: "Intern",                  location: "SF",            deadline: "2026-09-15" },
  { id: "app-cohere",     tier: "T1 US AI startups", company: "Cohere",       role: "Intern",                  location: "NYC/Toronto",   deadline: "2026-09-15" },
  { id: "app-cursor",     tier: "T1 US AI startups", company: "Cursor",       role: "Intern",                  location: "SF",            deadline: "2026-09-15" },
  { id: "app-replit",     tier: "T1 US AI startups", company: "Replit",       role: "Intern",                  location: "SF",            deadline: "2026-09-15" },
  { id: "app-hf-nyc",     tier: "T1 US AI startups", company: "Hugging Face", role: "Intern",                  location: "NYC",           deadline: "2026-09-15" },
  { id: "app-xai",        tier: "T1 US AI startups", company: "xAI",          role: "Intern",                  location: "SF/Memphis",    deadline: "2026-09-15" },
  { id: "app-together",   tier: "T1 US AI startups", company: "Together AI",  role: "Intern",                  location: "SF",            deadline: "2026-09-15" },

  // Tier 2 — US company, EU office
  { id: "app-anthropic-eu", tier: "T2 EU offices",   company: "Anthropic",    role: "Intern",                  location: "London/Dublin", deadline: "2026-10-01" },
  { id: "app-openai",       tier: "T2 EU offices",   company: "OpenAI",       role: "Intern",                  location: "Dublin/London", deadline: "2026-10-01" },
  { id: "app-hf-paris",     tier: "T2 EU offices",   company: "Hugging Face", role: "Intern",                  location: "Paris",         deadline: "2026-10-01" },
  { id: "app-datadog",      tier: "T2 EU offices",   company: "Datadog",      role: "Intern",                  location: "Paris/NYC",     deadline: "2026-10-01" },
  { id: "app-stripe",       tier: "T2 EU offices",   company: "Stripe",       role: "Intern",                  location: "Dublin",        deadline: "2026-10-01" },
  { id: "app-google-eu",    tier: "T2 EU offices",   company: "Google",       role: "Intern",                  location: "Zurich/London/Paris", deadline: "2026-10-01" },
  { id: "app-meta",         tier: "T2 EU offices",   company: "Meta",         role: "Intern",                  location: "London/Paris",  deadline: "2026-10-01" },
  { id: "app-apple",        tier: "T2 EU offices",   company: "Apple",        role: "Intern",                  location: "Paris/London",  deadline: "2026-10-01" },
  { id: "app-deepmind",     tier: "T2 EU offices",   company: "DeepMind",     role: "Intern",                  location: "London",        deadline: "2026-10-01" },

  // Tier 3 — Paris safety net
  { id: "app-mistral",  tier: "T3 Paris safety net", company: "Mistral",   role: "Intern", location: "Paris", deadline: "2026-11-01" },
  { id: "app-alan",     tier: "T3 Paris safety net", company: "Alan",      role: "Intern (warm: Thomas Rolf)", location: "Paris", deadline: "2026-11-01" },
  { id: "app-doctolib", tier: "T3 Paris safety net", company: "Doctolib",  role: "Intern", location: "Paris", deadline: "2026-11-01" },
  { id: "app-qonto",    tier: "T3 Paris safety net", company: "Qonto",     role: "Intern", location: "Paris", deadline: "2026-11-01" },
];

export const APPLICATIONS_TOTAL_GOAL = 30;

export const MOCK_PLATFORMS = ["Pramp", "interviewing.io", "with friend", "Other"];
export const MOCK_TYPES = ["DSA", "Code review / AI", "ML breadth", "System design", "Behavioral"];

export const ANKI_TOPICS = [
  { id: "anki-attention",   title: "Attention mechanisms" },
  { id: "anki-transformers", title: "Transformers architecture" },
  { id: "anki-norm",        title: "BatchNorm vs LayerNorm" },
  { id: "anki-opt",         title: "Optimizers (Adam, SGD, AdamW)" },
  { id: "anki-reg",         title: "Regularization techniques" },
  { id: "anki-fit",         title: "Overfitting/Underfitting diagnostics" },
  { id: "anki-ft-rag",      title: "Fine-tuning vs RAG" },
  { id: "anki-rlhf",        title: "RLHF / DPO" },
  { id: "anki-eval",        title: "LLM evaluation methods" },
  { id: "anki-embed",       title: "Embeddings & vector search" },
];

export const ANKI_TARGET_CARDS = 50;

// Weighted overall progress. Each weight maps to the contribution from one chantier.
export const PROGRESS_WEIGHTS = {
  leetcode:     0.25,
  karpathy:     0.15,
  chipHuyen:    0.10,
  codeRewalk:   0.10,
  minidevin:    0.15,
  profile:      0.10,
  network:      0.05,
  applications: 0.10,
};

export const LEETCODE_GOAL = 150;
