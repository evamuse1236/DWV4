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

let cachedData: DiagnosticModule[] | null = null;
let cachedDataPromise: Promise<DiagnosticModule[]> | null = null;

export async function loadDiagnosticData(): Promise<DiagnosticModule[]> {
  if (cachedData) return cachedData;
  if (cachedDataPromise) return cachedDataPromise;

  cachedDataPromise = fetch("/diagnostic/diagnostic-data.json")
    .then(async (res) => {
      if (!res.ok) {
        throw new Error(`Failed to load diagnostic data: ${res.status}`);
      }
      return (await res.json()) as DiagnosticModule[];
    })
    .then((data) => {
      cachedData = data;
      return data;
    })
    .finally(() => {
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
      if (!res.ok) {
        throw new Error(`Failed to load diagnostic sets: ${res.status}`);
      }
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

function uniqBy<T>(items: T[], keyFn: (item: T) => string): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of items) {
    const key = keyFn(item);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

export function findDiagnosticGroup(
  modules: DiagnosticModule[],
  section: DiagnosticSection,
  moduleIndex: number
): DiagnosticGroupConfig | null {
  const prefix = section === "pyp" ? `PYP ${moduleIndex}:` : `Module ${moduleIndex}:`;

  // Data JSON doesn't include a `section` field — the prefix already
  // encodes the section ("Module N:" for DW, "PYP N:" for PYP).
  const matching = modules.filter((m) => m.module_name.startsWith(prefix));
  if (matching.length === 0) return null;

  const moduleName = matching[0].module_name;
  const moduleIds = matching.map((m) => m.id);
  const questionPool = matching.flatMap((m) => m.questions ?? []);
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

export function shuffleInPlace<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
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

