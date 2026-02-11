import type { Id } from "./_generated/dataModel";

export const CHARACTER_XP = {
  actionItem: 6,
  habitCompletion: 4,
  activityCompletion: 10,
  diagnosticPass: 40,
  diagnosticFail: 12,
  majorMastered: 60,
  readingPresentationRequested: 15,
  readingPresented: 30,
} as const;

const MOMENTUM_DOMAIN_NAME = "Momentum";
const MOMENTUM_DAILY_XP_CAP = 36;
const DEFAULT_DOMAIN_LEVEL_DIVISOR = 120;
const MOMENTUM_LEVEL_DIVISOR = 224;
export const STUDENT_CHARACTER_SYSTEM_ENABLED = false;

export function isStudentCharacterSystemEnabled() {
  return STUDENT_CHARACTER_SYSTEM_ENABLED;
}

export type CharacterSourceType =
  | "action_item"
  | "habit_completion"
  | "activity_completion"
  | "diagnostic_attempt"
  | "major_mastered"
  | "reading_milestone"
  | "manual_adjustment";

type CharacterProfileShape = {
  _id: Id<"characterProfiles">;
  totalXp: number;
  level: number;
  xpIntoLevel: number;
  xpNeededForNextLevel: number;
  activeTarotCardId?: Id<"tarotCards">;
};

const OVERALL_LEVEL_PROGRESS_POINTS = 100;

type DomainLevelEntry = {
  domainId: Id<"domains">;
  level: number;
  xp: number;
};

type DomainLevelSnapshot = {
  overallLevelRaw: number;
  overallLevel: number;
  xpIntoLevel: number;
  xpNeededForNextLevel: number;
  totalXp: number;
  domainLevels: Map<string, DomainLevelEntry>;
  allDomains: any[];
};

export function xpNeeded(level: number): number {
  return 100 + Math.max(0, level - 1) * 25;
}

export function domainStatLevel(domainXp: number): number {
  return 1 + Math.floor(Math.max(0, domainXp) / DEFAULT_DOMAIN_LEVEL_DIVISOR);
}

export function applyLevelUps(
  profile: Pick<
    CharacterProfileShape,
    "level" | "totalXp" | "xpIntoLevel" | "xpNeededForNextLevel"
  >,
  addedXp: number
) {
  let level = Math.max(1, profile.level);
  let xpIntoLevel = Math.max(0, profile.xpIntoLevel + Math.max(0, addedXp));
  let xpNeededForNextLevel = Math.max(1, profile.xpNeededForNextLevel || xpNeeded(level));

  while (xpIntoLevel >= xpNeededForNextLevel) {
    xpIntoLevel -= xpNeededForNextLevel;
    level += 1;
    xpNeededForNextLevel = xpNeeded(level);
  }

  return {
    totalXp: Math.max(0, profile.totalXp + Math.max(0, addedXp)),
    level,
    xpIntoLevel,
    xpNeededForNextLevel,
    leveledUp: level > profile.level,
  };
}

function normalizeText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s]+/g, " ");
}

function isMomentumDomainName(name: string | undefined | null) {
  return (name || "").toLowerCase() === MOMENTUM_DOMAIN_NAME.toLowerCase();
}

export function domainStatLevelForDomain(
  domainXp: number,
  domainName: string | undefined | null
): number {
  const divisor = isMomentumDomainName(domainName)
    ? MOMENTUM_LEVEL_DIVISOR
    : DEFAULT_DOMAIN_LEVEL_DIVISOR;
  return 1 + Math.floor(Math.max(0, domainXp) / divisor);
}

function toCanonicalDomainKey(domainName: string) {
  const lower = domainName.toLowerCase();
  if (lower.includes("math")) return "math";
  if (lower.includes("writing") || lower.includes("english")) return "writing";
  if (lower.includes("reading") || lower.includes("literature")) return "reading";
  if (lower.includes("coding") || lower.includes("code") || lower.includes("program")) {
    return "coding";
  }
  return "other";
}

const DOMAIN_KEYWORDS: Record<string, string[]> = {
  math: ["math", "mathematics", "algebra", "geometry", "arithmetic", "number"],
  writing: ["write", "writing", "english", "essay", "grammar", "journal"],
  reading: ["read", "reading", "book", "novel", "comprehension", "library"],
  coding: ["code", "coding", "program", "debug", "algorithm", "software"],
  other: [],
};

async function getDomainsSorted(ctx: any) {
  const domains = await ctx.db.query("domains").collect();
  return [...domains].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export async function getReadingDomainId(ctx: any): Promise<Id<"domains"> | undefined> {
  const domains = await getDomainsSorted(ctx);
  const reading = domains.find((domain: any) =>
    domain.name.toLowerCase().includes("reading")
  );
  return reading?._id;
}

export async function getMomentumDomainId(
  ctx: any
): Promise<Id<"domains"> | undefined> {
  const domains = await getDomainsSorted(ctx);
  const momentum = domains.find(
    (domain: any) => domain.name.toLowerCase() === MOMENTUM_DOMAIN_NAME.toLowerCase()
  );
  return momentum?._id;
}

export async function ensureMomentumDomain(ctx: any): Promise<Id<"domains">> {
  const existingId = await getMomentumDomainId(ctx);
  if (existingId) return existingId;

  const domains = await getDomainsSorted(ctx);
  const nextOrder =
    domains.length > 0
      ? Math.max(...domains.map((domain: any) => domain.order ?? 0)) + 1
      : 1;

  const insertedId = await ctx.db.insert("domains", {
    name: MOMENTUM_DOMAIN_NAME,
    icon: "⚡",
    color: "#f59e0b",
    description: "Consistency momentum built through tasks and habits.",
    order: nextOrder,
  });
  return insertedId;
}

export async function inferDomainIdFromText(
  ctx: any,
  rawHints: Array<string | undefined | null>
): Promise<Id<"domains"> | undefined> {
  const domains = await getDomainsSorted(ctx);
  if (domains.length === 0) return undefined;

  const text = normalizeText(rawHints.filter(Boolean).join(" "));
  if (!text.trim()) {
    return (await getReadingDomainId(ctx)) ?? domains[0]?._id;
  }

  let best: { domainId: Id<"domains">; score: number } | null = null;

  for (const domain of domains) {
    const domainName = domain.name.toLowerCase();
    const canonicalKey = toCanonicalDomainKey(domain.name);
    const aliases = DOMAIN_KEYWORDS[canonicalKey] || [];
    const domainTokens = domainName
      .split(/\s+/)
      .filter((token: string) => token.length >= 3);

    let score = 0;
    if (text.includes(domainName)) score += 5;

    for (const token of domainTokens) {
      if (text.includes(token)) score += 2;
    }

    for (const keyword of aliases) {
      if (text.includes(keyword)) score += 1;
    }

    if (!best || score > best.score) {
      best = { domainId: domain._id, score };
    }
  }

  if (best && best.score > 0) {
    return best.domainId;
  }

  return (await getReadingDomainId(ctx)) ?? domains[0]?._id;
}

function computeOverallLevelFromDomainLevels(levels: number[]) {
  if (levels.length === 0) {
    return {
      overallLevelRaw: 1,
      overallLevel: 1,
      xpIntoLevel: 0,
      xpNeededForNextLevel: OVERALL_LEVEL_PROGRESS_POINTS,
    };
  }

  const safeLevels = levels.map((level) => Math.max(1, level));
  const overallLevelRaw =
    safeLevels.reduce((sum, level) => sum + level, 0) / safeLevels.length;
  const overallLevel = Math.max(1, Math.floor(overallLevelRaw));
  const fractional = Math.max(0, overallLevelRaw - overallLevel);
  const xpIntoLevel = Math.round(fractional * OVERALL_LEVEL_PROGRESS_POINTS);

  return {
    overallLevelRaw,
    overallLevel,
    xpIntoLevel,
    xpNeededForNextLevel: OVERALL_LEVEL_PROGRESS_POINTS,
  };
}

async function buildDomainLevelSnapshot(ctx: any, userId: Id<"users">): Promise<DomainLevelSnapshot> {
  const [allDomains, statRows] = await Promise.all([
    getDomainsSorted(ctx),
    ctx.db
      .query("characterDomainStats")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .collect(),
  ]);

  const statByDomainId = new Map<string, any>(
    statRows.map((row: any) => [row.domainId.toString(), row])
  );

  const domainLevels = new Map<string, DomainLevelEntry>();
  let totalXp = 0;
  const levelsForAverage: number[] = [];

  for (const domain of allDomains) {
    const stat = statByDomainId.get(domain._id.toString());
    const xp = Math.max(0, stat?.xp ?? 0);
    const level = domainStatLevelForDomain(xp, domain.name);
    totalXp += xp;
    levelsForAverage.push(level);
    domainLevels.set(domain._id.toString(), {
      domainId: domain._id,
      level,
      xp,
    });
  }

  // Fallback safety if domain rows were removed but stats still exist.
  if (levelsForAverage.length === 0 && statRows.length > 0) {
    for (const stat of statRows) {
      totalXp += Math.max(0, stat.xp);
      levelsForAverage.push(Math.max(1, domainStatLevel(stat.xp)));
      domainLevels.set(stat.domainId.toString(), {
        domainId: stat.domainId,
        level: Math.max(1, domainStatLevel(stat.xp)),
        xp: Math.max(0, stat.xp),
      });
    }
  }

  const overall = computeOverallLevelFromDomainLevels(levelsForAverage);
  return {
    ...overall,
    totalXp,
    domainLevels,
    allDomains,
  };
}

export async function getDomainLevelSnapshot(ctx: any, userId: Id<"users">) {
  return await buildDomainLevelSnapshot(ctx, userId);
}

export async function refreshProfileFromDomainLevels(
  ctx: any,
  userId: Id<"users">,
  existingProfile?: CharacterProfileShape
) {
  const profile = existingProfile ?? ((await ensureCharacterProfile(ctx, userId)) as CharacterProfileShape);
  const snapshot = await buildDomainLevelSnapshot(ctx, userId);
  const now = Date.now();

  await ctx.db.patch(profile._id, {
    totalXp: snapshot.totalXp,
    level: snapshot.overallLevel,
    xpIntoLevel: snapshot.xpIntoLevel,
    xpNeededForNextLevel: snapshot.xpNeededForNextLevel,
    updatedAt: now,
  });

  return {
    profile: {
      ...profile,
      totalXp: snapshot.totalXp,
      level: snapshot.overallLevel,
      xpIntoLevel: snapshot.xpIntoLevel,
      xpNeededForNextLevel: snapshot.xpNeededForNextLevel,
      updatedAt: now,
    },
    snapshot,
  };
}

export async function ensureCharacterProfile(ctx: any, userId: Id<"users">) {
  const existing = await ctx.db
    .query("characterProfiles")
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
    .first();
  if (existing) return existing;

  const now = Date.now();
  const profileId = await ctx.db.insert("characterProfiles", {
    userId,
    totalXp: 0,
    level: 1,
    xpIntoLevel: 0,
    xpNeededForNextLevel: xpNeeded(1),
    createdAt: now,
    updatedAt: now,
  });

  const created = await ctx.db.get(profileId);
  if (!created) throw new Error("Failed to create character profile.");
  return created;
}

function sortCardsForEquip(cards: any[]) {
  return [...cards].sort((a, b) => {
    const levelDiff = (a.unlockLevel ?? 0) - (b.unlockLevel ?? 0);
    if (levelDiff !== 0) return levelDiff;
    return (a.displayOrder ?? 0) - (b.displayOrder ?? 0);
  });
}

function isCardEligible(card: any, snapshot: DomainLevelSnapshot) {
  if (!card.isActive) return false;
  if (card.domainAffinityId) {
    const domainLevel =
      snapshot.domainLevels.get(card.domainAffinityId.toString())?.level ?? 1;
    return domainLevel >= card.unlockLevel;
  }
  return snapshot.overallLevel >= card.unlockLevel;
}

export function isCardEligibleForSnapshot(card: any, snapshot: {
  overallLevel: number;
  domainLevels: Map<string, { level: number }>;
}) {
  if (!card.isActive) return false;
  if (card.domainAffinityId) {
    const domainLevel =
      snapshot.domainLevels.get(card.domainAffinityId.toString())?.level ?? 1;
    return domainLevel >= card.unlockLevel;
  }
  return snapshot.overallLevel >= card.unlockLevel;
}

export async function unlockEligibleCards(
  ctx: any,
  userId: Id<"users">,
  snapshot?: DomainLevelSnapshot
) {
  if (!isStudentCharacterSystemEnabled()) {
    return { newlyUnlocked: [] as Id<"tarotCards">[] };
  }

  const now = Date.now();
  const profile = await ensureCharacterProfile(ctx, userId);
  const effectiveSnapshot = snapshot ?? (await buildDomainLevelSnapshot(ctx, userId));

  const allCards = await ctx.db.query("tarotCards").collect();
  const activeEligibleCards = allCards.filter((card: any) =>
    isCardEligible(card, effectiveSnapshot)
  );

  const unlockedRows = await ctx.db
    .query("studentTarotUnlocks")
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
    .collect();
  const unlockedByCardId = new Set(unlockedRows.map((row: any) => row.tarotCardId.toString()));

  const newlyUnlocked: Id<"tarotCards">[] = [];
  for (const card of activeEligibleCards) {
    if (unlockedByCardId.has(card._id.toString())) continue;
    await ctx.db.insert("studentTarotUnlocks", {
      userId,
      tarotCardId: card._id,
      unlockedAt: now,
      unlockReason: "level",
    });
    unlockedByCardId.add(card._id.toString());
    newlyUnlocked.push(card._id);
  }

  const unlockedCardDocs = sortCardsForEquip(
    allCards.filter((card: any) => unlockedByCardId.has(card._id.toString()))
  );

  if (unlockedCardDocs.length > 0) {
    const activeCardStillUnlocked =
      profile.activeTarotCardId &&
      unlockedByCardId.has(profile.activeTarotCardId.toString());
    if (!activeCardStillUnlocked) {
      await ctx.db.patch(profile._id, {
        activeTarotCardId: unlockedCardDocs[0]._id,
        updatedAt: now,
      });
    }
  }

  return { newlyUnlocked };
}

function getMaxConsecutiveDays(dates: string[]) {
  if (dates.length === 0) return 0;
  const unique = Array.from(new Set(dates)).sort();
  let maxStreak = 1;
  let currentStreak = 1;

  for (let i = 1; i < unique.length; i++) {
    const prev = new Date(unique[i - 1]);
    const curr = new Date(unique[i]);
    const diffDays = Math.round(
      (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diffDays === 1) {
      currentStreak += 1;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else if (diffDays > 1) {
      currentStreak = 1;
    }
  }

  return maxStreak;
}

async function getAnyHabitMaxStreak(ctx: any, userId: Id<"users">) {
  const completions = await ctx.db
    .query("habitCompletions")
    .withIndex("by_user_date", (q: any) => q.eq("userId", userId))
    .collect();

  const byHabit = new Map<string, string[]>();
  for (const row of completions) {
    if (!row.completed) continue;
    const key = row.habitId.toString();
    if (!byHabit.has(key)) byHabit.set(key, []);
    byHabit.get(key)?.push(row.date);
  }

  let best = 0;
  for (const dates of byHabit.values()) {
    best = Math.max(best, getMaxConsecutiveDays(dates));
  }
  return best;
}

export async function evaluateAndAwardBadges(ctx: any, userId: Id<"users">) {
  if (!isStudentCharacterSystemEnabled()) {
    return { newlyAwarded: [] as string[] };
  }

  const refreshed = await refreshProfileFromDomainLevels(ctx, userId);
  const profile = refreshed.profile;
  const now = Date.now();

  const badgeDefinitions = (await ctx.db.query("badgeDefinitions").collect())
    .filter((badge: any) => badge.isActive)
    .sort((a: any, b: any) => a.displayOrder - b.displayOrder);

  const earnedRows = await ctx.db
    .query("studentBadges")
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
    .collect();
  const earnedCodes = new Set(earnedRows.map((row: any) => row.badgeCode));

  const masteredCount = (
    await ctx.db
      .query("studentMajorObjectives")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .filter((q: any) => q.eq(q.field("status"), "mastered"))
      .collect()
  ).length;

  const diagnosticPasses = (
    await ctx.db
      .query("diagnosticAttempts")
      .withIndex("by_passed", (q: any) => q.eq("passed", true))
      .filter((q: any) => q.eq(q.field("userId"), userId))
      .collect()
  ).length;

  const readingPresented = (
    await ctx.db
      .query("studentBooks")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .filter((q: any) => q.eq(q.field("status"), "presented"))
      .collect()
  ).length;

  const habitStreak = await getAnyHabitMaxStreak(ctx, userId);

  const metrics = {
    level: profile.level,
    total_mastered: masteredCount,
    diagnostic_passes: diagnosticPasses,
    habit_streak: habitStreak,
    reading_presented: readingPresented,
  } as const;

  const newlyAwarded: string[] = [];

  for (const badge of badgeDefinitions) {
    if (earnedCodes.has(badge.code)) continue;
    const value =
      badge.thresholdType === "level"
        ? metrics.level
        : badge.thresholdType === "total_mastered"
          ? metrics.total_mastered
          : badge.thresholdType === "diagnostic_passes"
            ? metrics.diagnostic_passes
            : badge.thresholdType === "habit_streak"
              ? metrics.habit_streak
              : metrics.reading_presented;
    if (value < badge.thresholdValue) continue;

    await ctx.db.insert("studentBadges", {
      userId,
      badgeCode: badge.code,
      awardedAt: now,
      meta: {
        thresholdType: badge.thresholdType,
        thresholdValue: badge.thresholdValue,
        currentValue: value,
      },
    });
    earnedCodes.add(badge.code);
    newlyAwarded.push(badge.code);
  }

  return { newlyAwarded };
}

export async function awardXpIfNotExists(
  ctx: any,
  args: {
    userId: Id<"users">;
    sourceType: CharacterSourceType;
    sourceKey: string;
    xp: number;
    domainId?: Id<"domains">;
    meta?: any;
  }
) {
  if (!isStudentCharacterSystemEnabled()) {
    return { awarded: false, reason: "character_system_inactive" as const };
  }

  const safeXp = Math.max(0, Math.floor(args.xp));
  if (safeXp <= 0) {
    return { awarded: false, reason: "non_positive_xp" as const };
  }

  const existing = await ctx.db
    .query("characterXpLedger")
    .withIndex("by_user_sourceKey", (q: any) =>
      q.eq("userId", args.userId).eq("sourceKey", args.sourceKey)
    )
    .first();

  if (existing) {
    return {
      awarded: false,
      reason: "already_exists" as const,
      ledgerId: existing._id,
    };
  }

  const profile = (await ensureCharacterProfile(ctx, args.userId)) as CharacterProfileShape;
  const now = Date.now();
  let awardXp = safeXp;
  const awardDomain = args.domainId ? await ctx.db.get(args.domainId) : null;

  if (
    args.domainId &&
    (args.sourceType === "action_item" || args.sourceType === "habit_completion")
  ) {
    if (isMomentumDomainName(awardDomain?.name)) {
      const dayStart = new Date(now);
      dayStart.setUTCHours(0, 0, 0, 0);
      const dayEnd = dayStart.getTime() + 24 * 60 * 60 * 1000;

      const todayRows = await ctx.db
        .query("characterXpLedger")
        .withIndex("by_user_awardedAt", (q: any) =>
          q.eq("userId", args.userId).gte("awardedAt", dayStart.getTime())
        )
        .filter((q: any) => q.lt(q.field("awardedAt"), dayEnd))
        .collect();

      const todayMomentumTaskHabitXp = todayRows
        .filter(
          (row: any) =>
            (row.sourceType === "action_item" ||
              row.sourceType === "habit_completion") &&
            row.domainId?.toString() === args.domainId?.toString()
        )
        .reduce((sum: number, row: any) => sum + Math.max(0, row.xpAwarded), 0);

      const remaining = Math.max(
        0,
        MOMENTUM_DAILY_XP_CAP - todayMomentumTaskHabitXp
      );
      awardXp = Math.min(awardXp, remaining);

      if (awardXp <= 0) {
        return {
          awarded: false,
          reason: "momentum_daily_cap_reached" as const,
          dayCap: MOMENTUM_DAILY_XP_CAP,
          todayMomentumTaskHabitXp,
        };
      }
    }
  }

  const ledgerId = await ctx.db.insert("characterXpLedger", {
    userId: args.userId,
    sourceType: args.sourceType,
    sourceKey: args.sourceKey,
    xpAwarded: awardXp,
    domainId: args.domainId,
    meta: args.meta,
    awardedAt: now,
  });

  if (args.domainId) {
    const existingDomainStat = await ctx.db
      .query("characterDomainStats")
      .withIndex("by_user_domain", (q: any) =>
        q.eq("userId", args.userId).eq("domainId", args.domainId)
      )
      .first();

    if (!existingDomainStat) {
      await ctx.db.insert("characterDomainStats", {
        userId: args.userId,
        domainId: args.domainId,
        xp: awardXp,
        statLevel: domainStatLevelForDomain(awardXp, awardDomain?.name),
        updatedAt: now,
      });
    } else {
      const nextXp = Math.max(0, existingDomainStat.xp + awardXp);
      await ctx.db.patch(existingDomainStat._id, {
        xp: nextXp,
        statLevel: domainStatLevelForDomain(nextXp, awardDomain?.name),
        updatedAt: now,
      });
    }
  }

  const refreshed = await refreshProfileFromDomainLevels(ctx, args.userId, profile);
  const unlockResult = await unlockEligibleCards(ctx, args.userId, refreshed.snapshot);
  const badgeResult = await evaluateAndAwardBadges(ctx, args.userId);

  return {
    awarded: true,
    ledgerId,
    xpAwarded: awardXp,
    level: refreshed.profile.level,
    leveledUp: refreshed.profile.level > profile.level,
    newlyUnlockedTarotCardIds: unlockResult.newlyUnlocked,
    newlyAwardedBadgeCodes: badgeResult.newlyAwarded,
  };
}
