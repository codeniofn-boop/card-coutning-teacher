/**
 * drills.js — generators and graders for the counting drills.
 *
 * Every generator is pure: it takes a system, an rng and a config and returns
 * plain data the UI can render. Grading helpers live here too so the lesson
 * screens stay thin.
 */
import { buildShoe, drawCards } from './shoe.js';
import { makeCard, RANKS, SUITS, handValue, isTenValue } from './cards.js';
import { ACTION_LABELS, DEFAULT_RULES, basicStrategyAction, strategyCode } from './basicStrategy.js';
import { cardValue, runningCountTrail, distinctValues, hasHalfValues, roundCount } from './countingSystems.js';

/**
 * Unit 3 — card value flashcards.
 * Returns { items: [{ card, correct }], choices: [-1, 0, 1] }.
 * Cards are drawn from `decks` decks so distributions are realistic, and the
 * same card never shows twice in a row.
 */
export function generateCardValueDrill({ system, count = 20, rng = Math.random }) {
  const pool = drawCards(count * 2, { decks: 2, rng });
  const items = [];
  let last = null;
  for (const card of pool) {
    if (items.length >= count) break;
    if (last && last.rank === card.rank) continue;
    items.push({ card, correct: cardValue(system, card) });
    last = card;
  }
  return { items, choices: distinctValues(system) };
}

/**
 * Unit 4 — "count along": one card at a time with multiple-choice running counts.
 * Returns { items: [{ card, value, countAfter, choices }] }.
 */
export function generateCountAlongDrill({ system, count = 12, rng = Math.random }) {
  const cards = drawCards(count, { decks: 1, rng });
  const trail = runningCountTrail(system, cards);
  const items = cards.map((card, i) => ({
    card,
    value: cardValue(system, card),
    countAfter: trail[i],
    choices: countChoices(trail[i], system, rng),
  }));
  return { items, finalCount: trail[trail.length - 1] };
}

/**
 * Unit 4 — flashing groups of cards (singles, pairs, hands) with checkpoints.
 *   groupSize: number or [min, max]
 *   checkpointEvery: pause and ask for the count every N groups (the last group is always a checkpoint)
 * Returns { groups: [[card]], trail: [countAfterGroup], checkpoints: [groupIndex], finalCount }.
 */
export function generateFlashDrill({ system, groups = 20, groupSize = 1, checkpointEvery = 5, rng = Math.random }) {
  const size = () => (Array.isArray(groupSize) ? groupSize[0] + Math.floor(rng() * (groupSize[1] - groupSize[0] + 1)) : groupSize);
  const sizes = Array.from({ length: groups }, size);
  const total = sizes.reduce((a, b) => a + b, 0);
  const cards = drawCards(total, { decks: Math.ceil(total / 52), rng });
  const out = [];
  let cursor = 0;
  for (const n of sizes) {
    out.push(cards.slice(cursor, cursor + n));
    cursor += n;
  }
  const trail = [];
  let count = 0;
  for (const group of out) {
    for (const card of group) count = roundCount(count + cardValue(system, card));
    trail.push(count);
  }
  const checkpoints = new Set();
  for (let i = checkpointEvery - 1; i < groups; i += checkpointEvery) checkpoints.add(i);
  checkpoints.add(groups - 1);
  return { groups: out, trail, checkpoints: [...checkpoints].sort((a, b) => a - b), finalCount: trail[trail.length - 1] };
}

/**
 * Unit 4 — deck countdown. A full deck minus `removed` random cards is flashed
 * one at a time; the user enters the final count. For balanced systems the
 * answer equals minus the sum of the removed cards, which is what makes this
 * the classic self-checking drill.
 */
export function generateDeckCountdown({ system, removed = 1, rng = Math.random }) {
  const deck = buildShoe({ decks: 1, rng });
  const removedCards = deck.slice(0, removed);
  const cards = deck.slice(removed);
  const trail = runningCountTrail(system, cards);
  return { cards, removedCards, trail, finalCount: trail[trail.length - 1] };
}

/**
 * Three answer choices around the correct count: the right one plus two
 * nearby distractors. Half-value systems use ½ steps.
 */
export function countChoices(correct, system, rng = Math.random) {
  const step = hasHalfValues(system) ? 0.5 : 1;
  const offsets = [-2, -1, 1, 2].map((o) => o * step);
  const picks = new Set([correct]);
  while (picks.size < 3) {
    picks.add(roundCount(correct + offsets[Math.floor(rng() * offsets.length)]));
  }
  const arr = [...picks];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Parse a keypad string like "-3", "+2.5", "−1" into a number (or null). */
export function parseCountInput(text) {
  if (text == null) return null;
  const cleaned = String(text).replace('−', '-').replace('½', '.5').replace(/\s+/g, '');
  if (cleaned === '' || cleaned === '-' || cleaned === '+') return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? roundCount(n) : null;
}

/** Summarise a list of per-item results into accuracy figures. */
export function summarize(results) {
  const total = results.length;
  const correct = results.filter((r) => r.correct).length;
  return { total, correct, accuracy: total === 0 ? 0 : correct / total, mistakes: results.filter((r) => !r.correct) };
}

// ---------------------------------------------------------------- Unit 2: basic strategy


const SMALL = ['2', '3', '4', '5', '6', '7', '8', '9'];
const TENS = ['10', 'J', 'Q', 'K'];
/** Dealer upcards weighted like a real shoe: four ten-value ranks, one of everything else. */
const UPCARD_POOL = [...SMALL, ...TENS, 'A'];

function pick(arr, rng) {
  return arr[Math.floor(rng() * arr.length)];
}

function twoSuits(rng) {
  const a = pick(SUITS, rng);
  let b = pick(SUITS, rng);
  while (b === a) b = pick(SUITS, rng);
  return [a, b];
}

/** A random hard hand (no ace, not a pair) with the given total. */
function hardHand(total, rng) {
  const options = [];
  for (const r1 of [...SMALL, ...TENS]) {
    for (const r2 of [...SMALL, ...TENS]) {
      const v1 = isTenValue(r1) ? 10 : Number(r1);
      const v2 = isTenValue(r2) ? 10 : Number(r2);
      if (v1 + v2 === total && v1 !== v2) options.push([r1, r2]);
    }
  }
  const [r1, r2] = pick(options, rng);
  const [s1, s2] = twoSuits(rng);
  return [makeCard(r1, s1), makeCard(r2, s2)];
}

/**
 * Generate one strategy question for a category:
 *   'hard'      two-card hard totals 5–17 (decision-heavy 9–16 weighted)
 *   'soft'      A + 2..9
 *   'pairs'     any pair
 *   'surrender' stiff hands against strong upcards, plus look-alikes that should not surrender
 *   'mixed'     any of the above
 */
export function generateStrategyHand(category, rng = Math.random) {
  let cat = category;
  if (cat === 'mixed') cat = pick(['hard', 'hard', 'soft', 'pairs', 'surrender'], rng);
  let cards;
  let dealer;
  if (cat === 'hard') {
    const total = pick([5, 7, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13, 14, 15, 15, 16, 16, 17], rng);
    cards = hardHand(total, rng);
    dealer = pick(UPCARD_POOL, rng);
  } else if (cat === 'soft') {
    const [s1, s2] = twoSuits(rng);
    cards = [makeCard('A', s1), makeCard(pick(SMALL, rng), s2)];
    dealer = pick(UPCARD_POOL, rng);
  } else if (cat === 'pairs') {
    const rank = pick(RANKS, rng);
    const [s1, s2] = twoSuits(rng);
    cards = [makeCard(rank, s1), makeCard(rank, s2)];
    dealer = pick(UPCARD_POOL, rng);
  } else {
    const total = pick([14, 15, 15, 16, 16, 17, 13], rng);
    cards = hardHand(total, rng);
    dealer = pick(['8', '9', '9', '10', 'J', 'Q', 'K', 'A', 'A'], rng);
  }
  return { cards, dealer };
}

/** Human label such as "Hard 16", "Soft 18" or "Pair of 8s". */
export function describeHand(cards) {
  if (cards.length === 2 && pairKey(cards[0]) === pairKey(cards[1])) {
    const r = isTenValue(cards[0].rank) ? '10' : cards[0].rank;
    return `Pair of ${r === 'A' ? 'aces' : `${r}s`}`;
  }
  const { total, soft } = handValue(cards);
  return `${soft ? 'Soft' : 'Hard'} ${total}`;
}

function pairKey(card) {
  return isTenValue(card.rank) ? '10' : card.rank;
}

/**
 * Unit 2 drill: `count` hands with the correct action under `rules`.
 * Each item: { cards, dealer (card), correct ('H'|'S'|'D'|'P'|'R'), allowed, label }.
 */
export function generateStrategyDrill({ category = 'mixed', count = 15, rules = DEFAULT_RULES, rng = Math.random }) {
  const items = [];
  const seen = new Set();
  let guard = 0;
  while (items.length < count && guard++ < count * 40) {
    const { cards, dealer } = generateStrategyHand(category, rng);
    const key = `${describeHand(cards)}|${isTenValue(dealer) ? '10' : dealer}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const isPair = pairKey(cards[0]) === pairKey(cards[1]);
    const allowed = { double: true, split: isPair, surrender: rules.surrender !== false };
    const correct = basicStrategyAction(cards, dealer, rules, allowed);
    items.push({
      cards,
      dealer: makeCard(dealer, pick(SUITS, rng)),
      correct,
      allowed,
      code: strategyCode(cards, dealer, rules),
      label: `${describeHand(cards)} vs ${isTenValue(dealer) ? '10' : dealer}`,
    });
  }
  return { items, actions: ['H', 'S', 'D', 'P', 'R'].map((a) => ({ id: a, label: ACTION_LABELS[a] })) };
}
