import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeCard } from '../src/game/cards.js';
import { newHand, applyAction, dealerDraws, settleHand, correctAction, isBlackjack, openingDealOrder, findDeviation } from '../src/game/table.js';
import { betForTrueCount, keyCount, tcEquivalentUnbalanced, recommendedBet, riskOfRuin } from '../src/game/betting.js';
import { getSystem } from '../src/game/countingSystems.js';
import { generateDeckEstimationDrill, generateTrueCountDrill, generateBetDrill, generateDeviationDrill, truncateTowardZero } from '../src/game/drills.js';
import { createRng } from '../src/game/shoe.js';

const c = (r, s = 'S') => makeCard(r, s);
const S17 = { dealerHitsSoft17: false, doubleAfterSplit: true, surrender: true };

test('opening deal order deals two rounds ending with a hidden dealer card', () => {
  const order = openingDealOrder(3);
  assert.equal(order.length, 8);
  assert.deepEqual(order[3], { seat: 'dealer', hidden: false });
  assert.deepEqual(order[7], { seat: 'dealer', hidden: true });
});

test('actions: hit, double, split aces, surrender', () => {
  const deck = [c('5'), c('9'), c('K'), c('2')];
  const draw = () => deck.shift();
  let h = newHand(0, 2, true);
  h.cards = [c('7'), c('6', 'H')];
  const [hit] = applyAction(h, 'H', draw);
  assert.equal(hit.cards.length, 3);
  assert.equal(hit.done, false);
  const [dbl] = applyAction(h, 'D', draw);
  assert.equal(dbl.bet, 4);
  assert.ok(dbl.done);
  const aces = { ...newHand(0, 1, true), cards: [c('A'), c('A', 'H')] };
  const split = applyAction(aces, 'P', draw);
  assert.equal(split.length, 2);
  assert.ok(split[0].done && split[1].done);
  const [sur] = applyAction(h, 'R', draw);
  assert.ok(sur.surrendered);
});

test('dealer draws to 17 and hits soft 17 only under H17', () => {
  const draws = dealerDraws([c('A'), c('6', 'H')], () => c('5'), S17);
  assert.equal(draws.length, 0);
  const h17 = dealerDraws([c('A'), c('6', 'H')], () => c('K'), { ...S17, dealerHitsSoft17: true });
  assert.equal(h17.length, 1); // A,6,K = hard 17, stop
});

test('settlement', () => {
  const dealer = [c('K'), c('7', 'H')];
  assert.equal(settleHand({ ...newHand(0, 2), cards: [c('K'), c('9', 'H')] }, dealer, false).net, 2);
  assert.equal(settleHand({ ...newHand(0, 2), cards: [c('K'), c('6', 'H')] }, dealer, false).net, -2);
  assert.equal(settleHand({ ...newHand(0, 2), cards: [c('A'), c('K', 'H')] }, dealer, false).net, 3);
  assert.equal(settleHand({ ...newHand(0, 2), cards: [c('K'), c('7', 'D')] }, dealer, false).net, 0);
  assert.equal(settleHand({ ...newHand(0, 2), surrendered: true, cards: [c('K'), c('6', 'H')] }, dealer, false).net, -1);
  assert.ok(isBlackjack({ cards: [c('A'), c('Q')], fromSplit: false }));
  assert.ok(!isBlackjack({ cards: [c('A'), c('Q')], fromSplit: true }));
});

test('correct action uses indices for Hi-Lo when applicable', () => {
  const sixteen = { ...newHand(0, 1, true), cards: [c('K'), c('6', 'H')] };
  // Two-card 16 vs 10 can still surrender: surrender wins over the stand index.
  assert.equal(correctAction(sixteen, '10', { rules: S17, trueCount: 1, useIndices: true }).code, 'R');
  assert.equal(correctAction(sixteen, '10', { rules: S17, trueCount: 5, useIndices: false }).code, 'R');
  // Three-card 16 vs 10 cannot: stand at 0 or above, hit below.
  const multi = { ...newHand(0, 1, true), cards: [c('7'), c('5', 'H'), c('4', 'D')] };
  assert.equal(correctAction(multi, '10', { rules: S17, trueCount: 1, useIndices: true }).code, 'S');
  assert.equal(correctAction(multi, '10', { rules: S17, trueCount: -1, useIndices: true }).code, 'H');
  assert.equal(correctAction(multi, '10', { rules: S17, trueCount: 1, useIndices: false }).code, 'H');
  // Fab 4: 15 vs 10 surrenders at 0 or above, hits below.
  const fifteen = { ...newHand(0, 1, true), cards: [c('K'), c('5', 'H')] };
  assert.equal(correctAction(fifteen, '10', { rules: S17, trueCount: 0, useIndices: true }).code, 'R');
  assert.equal(correctAction(fifteen, '10', { rules: S17, trueCount: -1, useIndices: true }).code, 'H');
  const tens = { ...newHand(0, 1, true), cards: [c('K'), c('Q', 'H')] };
  assert.equal(correctAction(tens, '6', { rules: S17, trueCount: 4, useIndices: true }).code, 'P');
  assert.equal(findDeviation({ cards: [c('A'), c('5')], fromSplit: false }, '10'), null);
});

test('bet ramp and unbalanced equivalents', () => {
  assert.equal(betForTrueCount(0), 1);
  assert.equal(betForTrueCount(2), 2);
  assert.equal(betForTrueCount(3), 4);
  assert.equal(betForTrueCount(9), 8);
  const ko = getSystem('ko');
  assert.equal(keyCount(ko, 6), -4);
  assert.equal(tcEquivalentUnbalanced(ko, 4, 6), 4);
  assert.equal(tcEquivalentUnbalanced(ko, -4, 6), 1);
  assert.equal(recommendedBet(ko, { runningCount: 4, decks: 6 }), 6);
  assert.ok(riskOfRuin({ bankroll: 1000 }) < riskOfRuin({ bankroll: 400 }));
});

test('unit 6–9 generators', () => {
  const rng = createRng(5);
  for (const it of generateDeckEstimationDrill({ count: 10, rng }).items) {
    assert.ok(it.choices.includes(it.answer));
    assert.ok(Math.abs(it.exact - it.answer) <= 0.25 + 1e-9);
  }
  for (const it of generateTrueCountDrill({ count: 10, rng }).items) assert.equal(it.tc, truncateTowardZero(it.rc / it.decksLeft));
  for (const it of generateBetDrill({ system: getSystem('hilo'), count: 5, rng }).items) assert.equal(it.correct, betForTrueCount(it.trueCount));
  for (const it of generateBetDrill({ system: getSystem('red7'), count: 5, rng }).items) assert.ok(it.choices.includes(it.correct));
  for (const it of generateDeviationDrill({ set: 'mixed', count: 22, rng }).items) {
    assert.ok(it.options.includes(it.correct));
    assert.equal(it.cards.length, 2);
  }
  assert.equal(truncateTowardZero(-2.8), -2);
});
