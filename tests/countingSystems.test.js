import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SYSTEMS, getSystem, cardValue, runningCount, distinctValues, formatCount, deckSum, valueGroups, hasHalfValues } from '../src/game/countingSystems.js';
import { makeCard, fullDeck } from '../src/game/cards.js';

test('balanced systems sum to zero over a full deck, unbalanced ones do not', () => {
  for (const s of SYSTEMS) {
    const sum = deckSum(s);
    if (s.balanced) assert.equal(sum, 0, `${s.name} should be balanced`);
    else assert.notEqual(sum, 0, `${s.name} should be unbalanced`);
  }
});

test('KO deck sum is +4 and Red Seven deck sum is +2', () => {
  assert.equal(deckSum(getSystem('ko')), 4);
  assert.equal(deckSum(getSystem('red7')), 2);
});

test('Red Seven distinguishes red and black sevens', () => {
  const red7 = getSystem('red7');
  assert.equal(cardValue(red7, makeCard('7', 'H')), 1);
  assert.equal(cardValue(red7, makeCard('7', 'D')), 1);
  assert.equal(cardValue(red7, makeCard('7', 'S')), 0);
  assert.equal(cardValue(red7, makeCard('7', 'C')), 0);
});

test('Hi-Lo values', () => {
  const hilo = getSystem('hilo');
  assert.equal(cardValue(hilo, makeCard('2', 'S')), 1);
  assert.equal(cardValue(hilo, makeCard('6', 'S')), 1);
  assert.equal(cardValue(hilo, makeCard('7', 'S')), 0);
  assert.equal(cardValue(hilo, makeCard('9', 'S')), 0);
  assert.equal(cardValue(hilo, makeCard('10', 'S')), -1);
  assert.equal(cardValue(hilo, makeCard('K', 'S')), -1);
  assert.equal(cardValue(hilo, makeCard('A', 'S')), -1);
  assert.deepEqual(distinctValues(hilo), [-1, 0, 1]);
});

test('Wong Halves uses half values and rounds cleanly', () => {
  const halves = getSystem('halves');
  assert.ok(hasHalfValues(halves));
  const cards = [makeCard('2', 'S'), makeCard('2', 'H'), makeCard('5', 'D'), makeCard('9', 'C')];
  assert.equal(runningCount(halves, cards), 2);
  assert.equal(runningCount(halves, fullDeck()), 0);
  assert.equal(formatCount(0.5), '+½');
  assert.equal(formatCount(-1.5), '−1½');
});

test('formatCount', () => {
  assert.equal(formatCount(0), '0');
  assert.equal(formatCount(3), '+3');
  assert.equal(formatCount(-2), '−2');
});

test('valueGroups puts every rank in exactly one group (colour-split sevens aside)', () => {
  for (const s of SYSTEMS) {
    const entries = valueGroups(s).flatMap((g) => g.ranks);
    const ranks = entries.map((e) => e.rank + (e.color || ''));
    assert.equal(new Set(ranks).size, ranks.length);
    assert.ok(ranks.length >= 13);
  }
});
