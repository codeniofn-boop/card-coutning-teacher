import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateCardValueDrill, generateCountAlongDrill, generateFlashDrill, generateDeckCountdown, countChoices, parseCountInput } from '../src/game/drills.js';
import { getSystem, runningCount } from '../src/game/countingSystems.js';
import { createRng } from '../src/game/shoe.js';

const hilo = getSystem('hilo');

test('card value drill has the requested count and no immediate repeats', () => {
  const d = generateCardValueDrill({ system: hilo, count: 30, rng: createRng(5) });
  assert.equal(d.items.length, 30);
  for (let i = 1; i < d.items.length; i++) assert.notEqual(d.items[i].card.rank, d.items[i - 1].card.rank);
  assert.deepEqual(d.choices, [-1, 0, 1]);
});

test('count along trail is consistent and choices include the answer', () => {
  const d = generateCountAlongDrill({ system: hilo, count: 12, rng: createRng(9) });
  let rc = 0;
  for (const item of d.items) {
    rc += item.value;
    assert.equal(item.countAfter, rc);
    assert.ok(item.choices.includes(item.countAfter));
    assert.equal(item.choices.length, 3);
  }
});

test('flash drill checkpoints include the last group and trail matches running count', () => {
  const d = generateFlashDrill({ system: hilo, groups: 8, groupSize: [3, 5], checkpointEvery: 4, rng: createRng(2) });
  assert.equal(d.groups.length, 8);
  assert.deepEqual(d.checkpoints, [3, 7]);
  const all = d.groups.flat();
  assert.equal(d.finalCount, runningCount(hilo, all));
  for (const g of d.groups) assert.ok(g.length >= 3 && g.length <= 5);
});

test('deck countdown answer equals minus the held-out cards for a balanced system', () => {
  const d = generateDeckCountdown({ system: hilo, removed: 2, rng: createRng(11) });
  assert.equal(d.cards.length, 50);
  assert.equal(d.finalCount, -runningCount(hilo, d.removedCards));
});

test('count choices and keypad parsing', () => {
  const choices = countChoices(3, hilo, createRng(1));
  assert.ok(choices.includes(3));
  assert.equal(new Set(choices).size, 3);
  assert.equal(parseCountInput('-3'), -3);
  assert.equal(parseCountInput('−2'), -2);
  assert.equal(parseCountInput('2.5'), 2.5);
  assert.equal(parseCountInput(''), null);
  assert.equal(parseCountInput('-'), null);
});

import { generateStrategyDrill, describeHand } from '../src/game/drills.js';
import { makeCard } from '../src/game/cards.js';
import { basicStrategyAction, DEFAULT_RULES } from '../src/game/basicStrategy.js';

test('strategy drill hands match their category and the table', () => {
  for (const category of ['hard', 'soft', 'pairs', 'surrender']) {
    const d = generateStrategyDrill({ category, count: 12, rng: createRng(4) });
    assert.equal(d.items.length, 12);
    for (const item of d.items) {
      const label = describeHand(item.cards);
      if (category === 'hard' || category === 'surrender') assert.ok(label.startsWith('Hard'), label);
      if (category === 'soft') assert.ok(label.startsWith('Soft'), label);
      if (category === 'pairs') assert.ok(label.startsWith('Pair'), label);
      assert.equal(item.correct, basicStrategyAction(item.cards, item.dealer.rank, DEFAULT_RULES, item.allowed));
      assert.ok(['H', 'S', 'D', 'P', 'R'].includes(item.correct));
    }
  }
});

test('describeHand', () => {
  assert.equal(describeHand([makeCard('A', 'S'), makeCard('7', 'H')]), 'Soft 18');
  assert.equal(describeHand([makeCard('K', 'S'), makeCard('6', 'H')]), 'Hard 16');
  assert.equal(describeHand([makeCard('K', 'S'), makeCard('Q', 'H')]), 'Pair of 10s');
  assert.equal(describeHand([makeCard('A', 'S'), makeCard('A', 'H')]), 'Pair of aces');
});
