/**
 * badges.js — achievements.
 *
 * Each badge has a `check(ctx)` that is evaluated after every lesson with
 *   ctx = { xp, streak, track, tracks, history, lesson, result }
 * Badges that depend on units not built yet keep a check that returns false,
 * so they show as locked goals in the profile.
 */
import { levelInfo } from './progress.js';

export const BADGES = [
  {
    id: 'first-lesson',
    name: 'First steps',
    icon: '🐣',
    description: 'Complete your first lesson.',
    check: ({ history }) => history.length >= 1,
  },
  {
    id: 'flawless',
    name: 'Flawless',
    icon: '✨',
    description: 'Finish a lesson of 10+ questions with 100% accuracy.',
    check: ({ result }) => result.accuracy === 1 && result.total >= 10,
  },
  {
    id: 'tag-machine',
    name: 'Tag machine',
    icon: '🏷️',
    description: 'Pass Lightning values with 95% accuracy or better.',
    check: ({ lesson, result }) => lesson.id === 'values-lightning' && result.passed && result.accuracy >= 0.95,
  },
  {
    id: 'deck-25',
    name: 'Deck in 25',
    icon: '⏱️',
    description: 'Count a full deck in under 25 seconds with 100% accuracy.',
    check: ({ lesson, result }) => lesson.id === 'running-deck' && result.accuracy === 1 && result.durationMs <= 25000,
  },
  {
    id: 'by-the-book',
    name: 'By the book',
    icon: '📋',
    description: 'Complete every Basic strategy lesson.',
    check: ({ track }) => ['strategy-hard', 'strategy-soft', 'strategy-pairs', 'strategy-surrender', 'strategy-mixed'].every((id) => track.skills[id]?.completions > 0),
  },
  {
    id: 'eraser',
    name: 'Eraser',
    icon: '🤝',
    description: 'Pass Cancel sprint with 90% accuracy or better.',
    check: ({ lesson, result }) => lesson.id === 'cancel-speed' && result.passed,
  },
  {
    id: 'running-start',
    name: 'Running start',
    icon: '🧮',
    description: 'Complete every Running count lesson.',
    check: ({ track }) =>
      ['running-along', 'running-singles', 'running-pairs', 'running-hands', 'running-deck'].every((id) => track.skills[id]?.completions > 0),
  },
  {
    id: 'streak-3',
    name: 'Hat trick',
    icon: '🔥',
    description: 'Keep a 3-day streak.',
    check: ({ streak }) => streak.count >= 3,
  },
  {
    id: 'streak-7',
    name: 'On fire',
    icon: '🌋',
    description: 'Keep a 7-day streak.',
    check: ({ streak }) => streak.count >= 7,
  },
  {
    id: 'level-5',
    name: 'Shoe tracker',
    icon: '🎖️',
    description: 'Reach level 5.',
    check: ({ xp }) => levelInfo(xp).level >= 5,
  },
  {
    id: 'polyglot',
    name: 'Polyglot',
    icon: '🌐',
    description: 'Complete a lesson in two different counting systems.',
    check: ({ tracks }) => Object.values(tracks).filter((t) => Object.values(t.skills).some((s) => s.completions > 0)).length >= 2,
  },
  {
    id: 'sharpened',
    name: 'Sharpened',
    icon: '🔪',
    description: 'Finish 5 review sessions.',
    check: ({ history }) => history.filter((h) => h.review).length >= 5,
  },
  {
    id: 'full-shoe',
    name: 'Shoe counted',
    icon: '👞',
    description: 'Count a full 6-deck shoe without error. (Unit 10)',
    check: () => false,
  },
];

/** Badge ids newly earned given the state *after* a lesson has been applied. */
export function newlyEarnedBadges(ctx, earned) {
  const have = new Set(earned.map((b) => b.id));
  return BADGES.filter((b) => !have.has(b.id) && safeCheck(b, ctx)).map((b) => b.id);
}

function safeCheck(badge, ctx) {
  try {
    return !!badge.check(ctx);
  } catch {
    return false;
  }
}

export function getBadge(id) {
  return BADGES.find((b) => b.id === id) || null;
}
