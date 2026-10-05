import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  levelInfo,
  xpToReachLevel,
  updateStreak,
  emptyStreak,
  heartsNow,
  loseHeart,
  fullHearts,
  HEART_REGEN_MS,
  skillStrength,
  applyResultToSkill,
  rampSpeed,
  xpForResult,
  needsReview,
  dayKey,
} from '../src/learning/progress.js';

const DAY = 86400000;
const T0 = new Date(2026, 9, 5, 12).getTime(); // local noon, Oct 5 2026

test('level thresholds', () => {
  assert.equal(xpToReachLevel(1), 0);
  assert.equal(xpToReachLevel(2), 100);
  assert.equal(xpToReachLevel(3), 300);
  assert.equal(levelInfo(0).level, 1);
  assert.equal(levelInfo(99).level, 1);
  assert.equal(levelInfo(100).level, 2);
  assert.equal(levelInfo(350).level, 3);
  assert.equal(levelInfo(350).xpIntoLevel, 50);
});

test('streak starts, extends, holds on same day', () => {
  let s = emptyStreak();
  let r = updateStreak(s, T0);
  assert.equal(r.event, 'started');
  assert.equal(r.streak.count, 1);
  r = updateStreak(r.streak, T0 + 3600000);
  assert.equal(r.event, 'same');
  r = updateStreak(r.streak, T0 + DAY);
  assert.equal(r.event, 'extended');
  assert.equal(r.streak.count, 2);
});

test('a streak freeze covers exactly one missed day', () => {
  let r = updateStreak({ ...emptyStreak(), freezes: 1 }, T0);
  r = updateStreak(r.streak, T0 + 2 * DAY);
  assert.equal(r.event, 'frozen');
  assert.equal(r.streak.count, 2);
  assert.equal(r.streak.freezes, 0);
  assert.deepEqual(r.streak.frozenDays, [dayKey(T0 + DAY)]);
  // no freeze left → reset
  r = updateStreak(r.streak, T0 + 4 * DAY);
  assert.equal(r.event, 'reset');
  assert.equal(r.streak.count, 1);
});

test('hearts regenerate one per 30 minutes', () => {
  let h = fullHearts(T0);
  h = loseHeart(h, T0);
  h = loseHeart(h, T0);
  assert.equal(h.count, 3);
  assert.equal(heartsNow(h, T0 + HEART_REGEN_MS - 1).count, 3);
  assert.equal(heartsNow(h, T0 + HEART_REGEN_MS).count, 4);
  assert.equal(heartsNow(h, T0 + 10 * HEART_REGEN_MS).count, 5);
});

test('skill strength decays and flags review', () => {
  const lesson = { id: 'x', xp: 10, config: {} };
  const skill = applyResultToSkill(null, lesson, { accuracy: 1, correct: 10, total: 10, passed: true, durationMs: 5000 }, T0);
  assert.equal(skill.completions, 1);
  assert.equal(skill.mastery, 1);
  assert.ok(skillStrength(skill, T0) > 0.99);
  assert.ok(skillStrength(skill, T0 + 1.5 * DAY) < 0.51);
  assert.ok(needsReview(skill, T0 + 5 * DAY));
  const failed = applyResultToSkill(skill, lesson, { accuracy: 0.5, correct: 5, total: 10, passed: false }, T0 + DAY);
  assert.equal(failed.completions, 1);
  assert.equal(failed.mastery, 0);
});

test('drill speed ramps with accuracy', () => {
  const lesson = { id: 'x', xp: 10, config: { baseSpeedMs: 1000, minSpeedMs: 400 } };
  assert.equal(rampSpeed(lesson, null, { accuracy: 1 }), 880);
  assert.equal(rampSpeed(lesson, { speedMs: 420 }, { accuracy: 1 }), 400);
  assert.equal(rampSpeed(lesson, { speedMs: 1000 }, { accuracy: 0.5 }), 1150);
  assert.equal(rampSpeed(lesson, { speedMs: 1000 }, { accuracy: 0.85 }), 1000);
});

test('xp rewards', () => {
  const lesson = { id: 'x', xp: 20, config: { baseSpeedMs: 1000 } };
  assert.equal(xpForResult(lesson, { passed: true, accuracy: 1, speedMs: 500 }).total, 35);
  assert.equal(xpForResult(lesson, { passed: true, accuracy: 0.9 }).total, 20);
  assert.equal(xpForResult(lesson, { passed: false, accuracy: 0.5 }).total, 7);
  assert.equal(xpForResult(lesson, { passed: true, accuracy: 1, speedMs: 500 }, { review: true }).total, 17);
});
