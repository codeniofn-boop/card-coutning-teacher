/**
 * shoe.js — shoe generation, shuffling and a tiny seeded RNG.
 *
 * Every drill takes an `rng` function (returns a float in [0, 1)) so that a
 * drill can be replayed from its seed. Use createRng(seed) for determinism or
 * Math.random when you don't care.
 */
import { fullDeck } from './cards.js';

/** mulberry32: small, fast, good-enough PRNG for drills. */
export function createRng(seed = Date.now()) {
  let a = seed >>> 0;
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher–Yates shuffle. Returns a new array; the input is not mutated. */
export function shuffle(cards, rng = Math.random) {
  const out = cards.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** `decks` shuffled decks as a flat array. Index 0 is the top of the shoe. */
export function buildShoe({ decks = 6, rng = Math.random } = {}) {
  let cards = [];
  for (let i = 0; i < decks; i++) cards = cards.concat(fullDeck());
  return shuffle(cards, rng);
}

/**
 * A dealable shoe with a cut card.
 *   penetration 0.75 on a 6-deck shoe means the cut card sits after 4.5 decks;
 *   `needsShuffle` flips to true once the cut card is passed.
 */
export function createShoe({ decks = 6, penetration = 0.75, rng = Math.random } = {}) {
  const cards = buildShoe({ decks, rng });
  const cutCardIndex = Math.round(cards.length * penetration);
  return {
    decks,
    penetration,
    cards,
    cutCardIndex,
    dealt: 0,
    get remaining() {
      return this.cards.length - this.dealt;
    },
    get needsShuffle() {
      return this.dealt >= this.cutCardIndex;
    },
    draw() {
      if (this.dealt >= this.cards.length) throw new Error('Shoe is empty');
      return this.cards[this.dealt++];
    },
  };
}

/** Exact decks remaining as a float (e.g. 3.27). */
export function decksRemaining(cardsRemaining) {
  return cardsRemaining / 52;
}

/** Decks remaining rounded to the nearest `step` (0.5 by default), the way a counter estimates it. */
export function estimateDecksRemaining(cardsRemaining, step = 0.5) {
  const exact = decksRemaining(cardsRemaining);
  return Math.max(step, Math.round(exact / step) * step);
}

/**
 * Draw `n` cards from a fresh set of `decks` decks without replacement.
 * Used by drills that want realistic card distributions.
 */
export function drawCards(n, { decks = 1, rng = Math.random } = {}) {
  const shoe = buildShoe({ decks: Math.max(decks, Math.ceil(n / 52)), rng });
  return shoe.slice(0, n);
}
