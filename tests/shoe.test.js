import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRng, shuffle, buildShoe, createShoe, estimateDecksRemaining, drawCards } from '../src/game/shoe.js';
import { fullDeck } from '../src/game/cards.js';

test('seeded rng is deterministic', () => {
  const a = createRng(42);
  const b = createRng(42);
  for (let i = 0; i < 10; i++) assert.equal(a(), b());
});

test('shuffle keeps every card exactly once', () => {
  const deck = fullDeck();
  const shuffled = shuffle(deck, createRng(1));
  assert.equal(shuffled.length, 52);
  assert.deepEqual(new Set(shuffled.map((c) => c.id)).size, 52);
  assert.notDeepEqual(shuffled.map((c) => c.id), deck.map((c) => c.id));
});

test('six-deck shoe has 312 cards and a cut card at penetration', () => {
  const shoe = createShoe({ decks: 6, penetration: 0.75, rng: createRng(7) });
  assert.equal(shoe.cards.length, 312);
  assert.equal(shoe.cutCardIndex, 234);
  for (let i = 0; i < 234; i++) shoe.draw();
  assert.ok(shoe.needsShuffle);
  assert.equal(buildShoe({ decks: 2 }).length, 104);
});

test('deck estimation rounds to half decks', () => {
  assert.equal(estimateDecksRemaining(52 * 3.3), 3.5);
  assert.equal(estimateDecksRemaining(10), 0.5);
});

test('drawCards never repeats within a single deck draw', () => {
  const cards = drawCards(52, { decks: 1, rng: createRng(3) });
  assert.equal(new Set(cards.map((c) => c.id)).size, 52);
});
