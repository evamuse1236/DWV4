export type DiagnosticSection = "dw" | "pyp";

export interface DiagnosticKALink {
  label: string;
  url: string;
}

export interface DiagnosticChoice {
  label: string;
  text: string;
  correct: boolean;
  misconception: string;
}

export interface DiagnosticQuestion {
  id: string;
  topic: string;
  topic_shortcode: string;
  grade: number;
  stem: string;
  visual_html: string;
  choices: DiagnosticChoice[];
  explanation: string;
}

export interface DiagnosticModule {
  id: string;
  name: string;
  module_name: string;
  ka_links: DiagnosticKALink[];
  standards: string[];
  questions: DiagnosticQuestion[];
}

export interface DiagnosticGroupConfig {
  section: DiagnosticSection;
  moduleIndex: number;
  moduleName: string;
  moduleIds: string[];
  questionPool: DiagnosticQuestion[];
  kaLinks: DiagnosticKALink[];
}

export interface DiagnosticSet {
  groupPrefix: string; // e.g. "Module 1:"
  setIndex: number; // 0-9
  questionIds: string[];
}

interface V2Choice {
  label?: string;
  text?: string;
  correct?: boolean;
  misconception_text?: string;
  misconception?: string;
}

interface V2Question {
  question_id?: string;
  standard_id?: string;
  stem?: string;
  visual_html?: string;
  explanation?: string;
  choices?: V2Choice[];
}

interface V2StandardIndex {
  standard_id?: string;
  grade?: number;
  module?: string;
  topic_id?: string;
  topic_title?: string;
  ka_links?: DiagnosticKALink[];
}

interface V2Topic {
  module?: string;
  topic_id?: string;
  topic_title?: string;
  power_available_standards?: string[];
  challenge_available_standards?: string[];
}

interface V2MasteryData {
  topics?: V2Topic[];
  standards_index?: Record<string, V2StandardIndex>;
  question_bank?: Record<string, V2Question[]>;
}

let cachedData: DiagnosticModule[] | null = null;
let cachedDataPromise: Promise<DiagnosticModule[]> | null = null;

function uniqBy<T>(items: T[], keyFn: (item: T) => string): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of items) {
    const key = keyFn(item);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

function normalizeV2Question(args: {
  question: V2Question;
  standardId: string;
  topicTitle: string;
  grade: number;
}): DiagnosticQuestion {
  const choices = (args.question.choices ?? []).map((choice, idx) => ({
    label: String(choice.label ?? String.fromCharCode(65 + idx)),
    text: String(choice.text ?? ""),
    correct: Boolean(choice.correct),
    misconception: String(choice.misconception_text ?? choice.misconception ?? ""),
  }));

  const questionId = String(
    args.question.question_id ?? `${args.standardId}_${Math.random().toString(36).slice(2)}`
  );

  return {
    id: questionId,
    topic: `${args.standardId} • ${args.topicTitle}`,
    topic_shortcode: args.standardId,
    grade: args.grade,
    stem: String(args.question.stem ?? ""),
    visual_html: String(args.question.visual_html ?? ""),
    choices,
    explanation: String(args.question.explanation ?? ""),
  };
}

function buildModulesFromV2(payload: V2MasteryData): DiagnosticModule[] {
  const topics = payload.topics ?? [];
  const standardsIndex = payload.standards_index ?? {};
  const questionBank = payload.question_bank ?? {};

  const modules = topics.map((topic, topicIdx) => {
    const moduleName = String(topic.module ?? "").trim();
    const topicId = String(topic.topic_id ?? `${topicIdx + 1}`);
    const topicTitle = String(topic.topic_title ?? `Topic ${topicIdx + 1}`);

    const standards = uniqBy(
      [
        ...(topic.power_available_standards ?? []),
        ...(topic.challenge_available_standards ?? []),
      ].map((s) => String(s)),
      (s) => s
    );

    const kaLinks = uniqBy(
      standards.flatMap((standardId) => standardsIndex[standardId]?.ka_links ?? []),
      (link) => `${link.label}|${link.url}`
    );

    const questions = uniqBy(
      standards.flatMap((standardId) => {
        const meta = standardsIndex[standardId];
        const grade = Number(meta?.grade ?? 0);
        const inferredTopicTitle = String(meta?.topic_title ?? topicTitle);
        return (questionBank[standardId] ?? []).map((q) =>
          normalizeV2Question({
            question: q,
            standardId,
            topicTitle: inferredTopicTitle,
            grade,
          })
        );
      }),
      (q) => q.id
    );

    return {
      id: topicId,
      name: topicTitle,
      module_name: moduleName,
      ka_links: kaLinks,
      standards,
      questions,
    };
  });

  return modules.filter((m) => Boolean(m.module_name) && m.questions.length > 0);
}

async function fetchLegacyModules(): Promise<DiagnosticModule[]> {
  const res = await fetch("/diagnostic/diagnostic-data.json");
  if (!res.ok) {
    throw new Error(`Failed to load diagnostic data: ${res.status}`);
  }
  return (await res.json()) as DiagnosticModule[];
}

export async function loadDiagnosticData(): Promise<DiagnosticModule[]> {
  if (cachedData) return cachedData;
  if (cachedDataPromise) return cachedDataPromise;

  cachedDataPromise = (async () => {
    try {
      const res = await fetch("/diagnostic_v2/mastery_data.json");
      if (!res.ok) {
        throw new Error(`Failed to load V2 mastery data: ${res.status}`);
      }
      const payload = (await res.json()) as V2MasteryData;
      const modules = buildModulesFromV2(payload);
      if (modules.length === 0) {
        throw new Error("No module data in V2 mastery payload");
      }
      cachedData = modules;
      return modules;
    } catch {
      const legacy = await fetchLegacyModules();
      cachedData = legacy;
      return legacy;
    }
  })().finally(() => {
    cachedDataPromise = null;
  });

  return cachedDataPromise;
}

let cachedSets: DiagnosticSet[] | null = null;
let cachedSetsPromise: Promise<DiagnosticSet[]> | null = null;

export async function loadDiagnosticSets(): Promise<DiagnosticSet[]> {
  if (cachedSets) return cachedSets;
  if (cachedSetsPromise) return cachedSetsPromise;

  cachedSetsPromise = fetch("/diagnostic/diagnostic-sets.json")
    .then(async (res) => {
      if (!res.ok) return [];
      return (await res.json()) as DiagnosticSet[];
    })
    .then((data) => {
      cachedSets = data;
      return data;
    })
    .finally(() => {
      cachedSetsPromise = null;
    });

  return cachedSetsPromise;
}

/**
 * Pick the pre-built set for this attempt.
 * Cycles through 10 sets (0-9) based on attemptCount.
 */
export function getSetForAttempt(
  sets: DiagnosticSet[],
  groupPrefix: string,
  attemptCount: number
): DiagnosticSet | null {
  const groupSets = sets.filter((s) => s.groupPrefix === groupPrefix);
  if (groupSets.length === 0) return null;
  const idx = attemptCount % groupSets.length;
  return groupSets.find((s) => s.setIndex === idx) ?? groupSets[0];
}

/**
 * Map question IDs from a set to full question objects, preserving set order.
 */
export function resolveSetQuestions(
  set: DiagnosticSet,
  questionPool: DiagnosticQuestion[]
): DiagnosticQuestion[] {
  const byId = new Map(questionPool.map((q) => [q.id, q]));
  const resolved: DiagnosticQuestion[] = [];
  for (const id of set.questionIds) {
    const q = byId.get(id);
    if (q) resolved.push(q);
  }
  return resolved;
}

export function findDiagnosticGroup(
  modules: DiagnosticModule[],
  section: DiagnosticSection,
  moduleIndex: number
): DiagnosticGroupConfig | null {
  const primaryPrefix = section === "pyp" ? `PYP ${moduleIndex}:` : `Module ${moduleIndex}:`;
  const fallbackPrefix = `Module ${moduleIndex}:`;

  let matching = modules.filter((m) => m.module_name.startsWith(primaryPrefix));
  if (matching.length === 0) {
    matching = modules.filter((m) => m.module_name.startsWith(fallbackPrefix));
  }
  if (matching.length === 0) return null;

  const moduleName = matching[0].module_name;
  const moduleIds = matching.map((m) => m.id);
  const questionPool = uniqBy(
    matching.flatMap((m) => m.questions ?? []),
    (q) => q.id
  );
  const kaLinks = uniqBy(
    matching.flatMap((m) => m.ka_links ?? []),
    (l) => l.url
  );

  return {
    section,
    moduleIndex,
    moduleName,
    moduleIds,
    questionPool,
    kaLinks,
  };
}

export function getQuizLength(questionPoolSize: number): number {
  return Math.max(1, Math.round(questionPoolSize / 3));
}

function hashSeed(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffleInPlace<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

export function selectDeterministicQuestions(args: {
  questionPool: DiagnosticQuestion[];
  count: number;
  seed: string;
}): DiagnosticQuestion[] {
  const uniqPool = uniqBy(args.questionPool, (q) => q.id);
  const shuffled = uniqPool.slice();
  const random = mulberry32(hashSeed(args.seed));

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    const tmp = shuffled[i];
    shuffled[i] = shuffled[j];
    shuffled[j] = tmp;
  }

  return shuffled.slice(0, Math.min(args.count, shuffled.length));
}

export function getUsedQuestionKey(args: {
  userId: string;
  majorObjectiveId: string;
  diagnosticModuleName: string;
}): string {
  return `diag_used_${args.userId}_${args.majorObjectiveId}_${args.diagnosticModuleName}`;
}

export function readUsedQuestionIds(key: string): string[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x) => typeof x === "string");
  } catch {
    return [];
  }
}

export function writeUsedQuestionIds(key: string, ids: string[]) {
  try {
    localStorage.setItem(key, JSON.stringify(ids));
  } catch {
    // ignore
  }
}

export function selectQuizQuestions(args: {
  questionPool: DiagnosticQuestion[];
  quizLen: number;
  usedQuestionIds: string[];
}): { questions: DiagnosticQuestion[]; nextUsedQuestionIds: string[] } {
  const usedSet = new Set(args.usedQuestionIds);
  const fresh = args.questionPool.filter((q) => !usedSet.has(q.id));

  const pool = fresh.length < args.quizLen ? args.questionPool.slice() : fresh.slice();
  const existingUsed = fresh.length < args.quizLen ? [] : args.usedQuestionIds.slice();

  shuffleInPlace(pool);
  const questions = pool.slice(0, args.quizLen);
  const nextUsedQuestionIds = existingUsed.concat(questions.map((q) => q.id));

  return { questions, nextUsedQuestionIds };
}

export function extractImageSrc(visualHtml: string | undefined | null): string | null {
  if (!visualHtml) return null;
  const m = visualHtml.match(/src=\"([^\"]+)\"/);
  return m?.[1] ?? null;
}
