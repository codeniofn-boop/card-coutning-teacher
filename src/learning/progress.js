/**
 * progress.js — XP, levels, streaks, hearts and skill mastery.
 *
 * Everything here is a pure function of (state, now). The store calls these
 * from its reducer; the UI calls the read-only helpers directly.
 */

export const MAX_HEARTS = 5;
export const HEART_REGEN_MS = 30 * 60 * 1000; // one heart every 30 minutes
export const MAX_FREEZES = 2;
export const MAX_MASTERY = 5;
export const REVIEW_THRESHOLD = 0.5; // below this strength a skill shows as "needs review"
export const DEFAULT_PASS_ACCURACY = 0.8;

// ---------- dates ----------

function pad(n) {
  return String(n).padStart(2, '0');
}

/** Local calendar day as 'YYYY-MM-DD'. Streaks are counted in the user's local time. */
export function dayKey(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Whole days between two day keys (b − a). */
export function daysBetween(a, b) {
  const [ay, am, ad] = a.split('-').map(Number);
  const [by, bm, bd] = b.split('-').map(Number);
  const da = new Date(ay, am - 1, ad, 12);
  const db = new Date(by, bm - 1, bd, 12);
  return Math.round((db - da) / 86400000);
}

export function shiftDay(key, days) {
  const [y, m, d] = key.split('-').map(Number);
  return dayKey(new Date(y, m - 1, d + days, 12));
}

// ---------- XP & levels ----------

/** XP needed to *reach* level n. Level 1 = 0, 2 = 100, 3 = 300, 4 = 600, 5 = 1000 … */
export function xpToReachLevel(level) {
  return 50 * level * (level - 1);
}

const LEVEL_TITLES = ['Rookie', 'Apprentice', 'Card tagger', 'Counter', 'Shoe tracker', 'Sharp', 'Advantage player', 'Pro', 'Legend'];

export function levelInfo(xp) {
  let level = 1;
  while (xp >= xpToReachLevel(level + 1)) level += 1;
  const start = xpToReachLevel(level);
  const next = xpToReachLevel(level + 1);
  return {
    level,
    title: LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)],
    xpIntoLevel: xp - start,
    xpForLevel: next - start,
    progress: (xp - start) / (next - start),
    nextLevelAt: next,
  };
}

/**
 * XP for a finished lesson.
 *   base          the lesson's xp when passed (a fail still earns a third)
 *   perfectBonus  +50% for 100% accuracy
 *   speedBonus    +5 when the drill ran at or under 60% of its base speed
 *   review        review sessions pay half
 */
export function xpForResult(lesson, result, { review = false } = {}) {
  const passed = result.passed;
  const base = passed ? lesson.xp : Math.round(lesson.xp / 3);
  const perfectBonus = passed && result.accuracy === 1 ? Math.round(lesson.xp * 0.5) : 0;
  const baseSpeed = lesson.config?.baseSpeedMs;
  const speedBonus = passed && baseSpeed && result.speedMs && result.speedMs <= baseSpeed * 0.6 ? 5 : 0;
  let total = base + perfectBonus + speedBonus;
  if (review) total = Math.max(1, Math.floor(total / 2));
  return { base, perfectBonus, speedBonus, total };
}

// ---------- streaks ----------

export function emptyStreak() {
  return { count: 0, longest: 0, lastActiveDay: null, freezes: 1, frozenDays: [] };
}

/**
 * Register activity at `now`.
 * Returns { streak, event } with event one of:
 *   'started'  first ever activity
 *   'same'     already active today
 *   'extended' consecutive day
 *   'frozen'   exactly one day was missed and a streak freeze covered it
 *   'reset'    streak broken, starting again at 1
 */
export function updateStreak(streak, now) {
  const today = dayKey(now);
  if (streak.lastActiveDay === today) return { streak, event: 'same' };
  if (!streak.lastActiveDay) {
    return { streak: { ...streak, count: 1, longest: Math.max(1, streak.longest), lastActiveDay: today }, event: 'started' };
  }
  const gap = daysBetween(streak.lastActiveDay, today);
  if (gap === 1) {
    const count = streak.count + 1;
    return { streak: { ...streak, count, longest: Math.max(count, streak.longest), lastActiveDay: today }, event: 'extended' };
  }
  if (gap === 2 && streak.freezes > 0) {
    const count = streak.count + 1;
    return {
      streak: {
        ...streak,
        count,
        longest: Math.max(count, streak.longest),
        lastActiveDay: today,
        freezes: streak.freezes - 1,
        frozenDays: [...streak.frozenDays, shiftDay(today, -1)],
      },
      event: 'frozen',
    };
  }
  return { streak: { ...streak, count: 1, lastActiveDay: today }, event: 'reset' };
}

/** Earn a streak freeze every 7 consecutive days, capped. */
export function maybeAwardFreeze(streak, event) {
  if ((event === 'extended' || event === 'frozen') && streak.count % 7 === 0 && streak.freezes < MAX_FREEZES) {
    return { streak: { ...streak, freezes: streak.freezes + 1 }, awarded: true };
  }
  return { streak, awarded: false };
}

/** Is the streak still alive right now (active today or yesterday)? */
export function streakAlive(streak, now) {
  if (!streak.lastActiveDay) return false;
  return daysBetween(streak.lastActiveDay, dayKey(now)) <= 1;
}

// ---------- hearts ----------

export function fullHearts(now) {
  return { count: MAX_HEARTS, lastRegenAt: now };
}

/** Apply time-based regeneration. */
export function heartsNow(hearts, now) {
  if (hearts.count >= MAX_HEARTS) return { count: MAX_HEARTS, lastRegenAt: now };
  const elapsed = now - hearts.lastRegenAt;
  const regen = Math.floor(elapsed / HEART_REGEN_MS);
  if (regen <= 0) return hearts;
  const count = Math.min(MAX_HEARTS, hearts.count + regen);
  return { count, lastRegenAt: count >= MAX_HEARTS ? now : hearts.lastRegenAt + regen * HEART_REGEN_MS };
}

export function loseHeart(hearts, now) {
  const h = heartsNow(hearts, now);
  if (h.count <= 0) return h;
  return { count: h.count - 1, lastRegenAt: h.count >= MAX_HEARTS ? now : h.lastRegenAt };
}

export function msUntilNextHeart(hearts, now) {
  const h = heartsNow(hearts, now);
  if (h.count >= MAX_HEARTS) return 0;
  return Math.max(0, h.lastRegenAt + HEART_REGEN_MS - now);
}

// ---------- skills, mastery and spaced repetition ----------

export function emptySkill() {
  return {
    attempts: 0,
    completions: 0,
    mastery: 0, // 0–5 crowns
    lastPracticedAt: null,
    bestAccuracy: 0,
    bestTimeMs: null,
    totalCorrect: 0,
    totalAnswered: 0,
    speedMs: null, // current adaptive drill speed (null → lesson default)
  };
}

/**
 * Memory strength 0–1 that decays with time since practice. Each mastery
 * level doubles the half-life: 1.5 days at mastery 1, 3 at 2, 6, 12, 24.
 */
export function skillStrength(skill, now) {
  if (!skill || !skill.lastPracticedAt || skill.completions === 0) return 0;
  const days = Math.max(0, now - skill.lastPracticedAt) / 86400000;
  const halfLife = 1.5 * 2 ** Math.max(0, skill.mastery - 1);
  return Math.exp((-Math.LN2 * days) / halfLife);
}

export function needsReview(skill, now) {
  return !!skill && skill.completions > 0 && skillStrength(skill, now) < REVIEW_THRESHOLD;
}

/** Current drill speed for a lesson, honouring the adaptive value and the global multiplier. */
export function effectiveSpeedMs(lesson, skill, multiplier = 1) {
  const base = lesson.config?.baseSpeedMs;
  if (!base) return null;
  const current = skill?.speedMs ?? base;
  return Math.round(current * multiplier);
}

/**
 * Ramp the drill speed: faster after a near-perfect run, slower after a rough one.
 * Returns the new speedMs (or null when the lesson is untimed).
 */
export function rampSpeed(lesson, skill, result) {
  const base = lesson.config?.baseSpeedMs;
  if (!base) return null;
  const min = lesson.config.minSpeedMs ?? Math.round(base / 3);
  const current = skill?.speedMs ?? base;
  if (result.accuracy >= 0.95) return Math.max(min, Math.round(current * 0.88));
  if (result.accuracy < 0.7) return Math.min(Math.round(base * 1.5), Math.round(current * 1.15));
  return current;
}

/** Fold a lesson result into a skill record. */
export function applyResultToSkill(skill, lesson, result, now) {
  const s = skill ? { ...skill } : emptySkill();
  s.attempts += 1;
  s.totalCorrect += result.correct;
  s.totalAnswered += result.total;
  s.lastPracticedAt = now;
  s.bestAccuracy = Math.max(s.bestAccuracy, result.accuracy);
  if (result.passed) {
    s.completions += 1;
    // Perfect runs always add a crown; passes add one only up to 3 crowns.
    if (result.accuracy === 1) s.mastery = Math.min(MAX_MASTERY, s.mastery + 1);
    else if (s.mastery < 3) s.mastery += 1;
    // Best time only makes sense for drills, not reading lessons.
    if (result.accuracy === 1 && result.durationMs && lesson.type !== 'reading') {
      s.bestTimeMs = s.bestTimeMs == null ? result.durationMs : Math.min(s.bestTimeMs, result.durationMs);
    }
  } else {
    s.mastery = Math.max(0, s.mastery - 1);
  }
  s.speedMs = rampSpeed(lesson, s, result);
  return s;
}

/** Lifetime accuracy for a skill, 0–1. */
export function skillAccuracy(skill) {
  if (!skill || skill.totalAnswered === 0) return 0;
  return skill.totalCorrect / skill.totalAnswered;
}

/**
 * The user's weakest practised skills, weakest first. Weakness blends decayed
 * strength with lifetime accuracy so both "forgotten" and "shaky" skills surface.
 */
export function weakestSkills(track, lessons, now, limit = 3) {
  const scored = [];
  for (const lesson of lessons) {
    const skill = track?.skills?.[lesson.id];
    if (!skill || skill.completions === 0) continue;
    const strength = skillStrength(skill, now);
    const accuracy = skillAccuracy(skill);
    scored.push({ lesson, skill, strength, accuracy, score: strength * 0.6 + accuracy * 0.4 });
  }
  return scored.sort((a, b) => a.score - b.score).slice(0, limit);
}
