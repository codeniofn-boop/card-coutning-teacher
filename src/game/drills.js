/**
 * drills.js — generators and graders for the counting drills.
 *
 * Every generator is pure: it takes a system, an rng and a config and returns
 * plain data the UI can render. Grading helpers live here too so the lesson
 * screens stay thin.
 */
import { buildShoe, drawCards } from './shoe.js';
import { ILLUSTRIOUS_18, FAB_4, deviationApplies } from './deviations.js';
import { DEFAULT_RAMP, keyCount, recommendedBet } from './betting.js';
import { makeCard, RANKS, SUITS, handValue, isTenValue } from './cards.js';
import { ACTION_LABELS, DEFAULT_RULES, basicStrategyAction, strategyCode } from './basicStrategy.js';
import { cardValue, runningCount, runningCountTrail, distinctValues, hasHalfValues, roundCount } from './countingSystems.js';

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
export function generateDeckCountdown({ system, removed = 1, decks = 1, rng = Math.random }) {
  const deck = buildShoe({ decks, rng });
  const removedCards = deck.slice(0, removed);
  const cards = deck.slice(removed);
  const trail = runningCountTrail(system, cards);
  return { cards, removedCards, trail, finalCount: trail[trail.length - 1] };
}

/**
 * `n` answer choices around the correct count: the right one plus nearby
 * distractors. Half-value systems use ½ steps.
 */
export function countChoices(correct, system, rng = Math.random, n = 3) {
  const step = hasHalfValues(system) ? 0.5 : 1;
  const offsets = [-3, -2, -1, 1, 2, 3].map((o) => o * step);
  const picks = new Set([correct]);
  while (picks.size < n) {
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

// ---------------------------------------------------------------- Unit 5: cancellation

/**
 * Cancellation drill: hands whose cards partly cancel out.
 *   handSize     number or [min, max]
 *   cancelBias   0–1, how often a hand is built to contain cancelling pairs
 * Each item: { cards, sum, choices, pairs } where `pairs` lists index pairs that
 * cancel (for feedback), and `choices` has five options including `sum`.
 */
export function generateCancellationDrill({ system, count = 12, handSize = 2, cancelBias = 0.6, rng = Math.random }) {
  // Enough decks that the pools can never run dry (which would loop forever).
  const maxSize = Array.isArray(handSize) ? handSize[1] : handSize;
  const deck = buildShoe({ decks: Math.max(2, Math.ceil((count * maxSize * 1.5) / 52)), rng });
  const byValue = new Map();
  for (const card of deck) {
    const v = cardValue(system, card);
    if (!byValue.has(v)) byValue.set(v, []);
    byValue.get(v).push(card);
  }
  const take = (v) => {
    const pool = byValue.get(v);
    return pool && pool.length ? pool.pop() : null;
  };
  const values = [...byValue.keys()];
  const size = () => (Array.isArray(handSize) ? handSize[0] + Math.floor(rng() * (handSize[1] - handSize[0] + 1)) : handSize);
  const items = [];
  while (items.length < count) {
    const n = size();
    const cards = [];
    // Seed with cancelling pairs when biased to.
    while (cards.length + 1 < n && rng() < cancelBias) {
      const v = values[Math.floor(rng() * values.length)];
      if (v === 0 || !byValue.has(-v)) continue;
      const a = take(v);
      const b = take(-v);
      if (a && b) cards.push(a, b);
    }
    let guard = 0;
    while (cards.length < n && guard++ < 500) {
      const v = values[Math.floor(rng() * values.length)];
      const c = take(v);
      if (c) cards.push(c);
    }
    // Shuffle the hand so pairs are not adjacent.
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [cards[i], cards[j]] = [cards[j], cards[i]];
    }
    const sum = runningCount(system, cards);
    items.push({ cards, sum, choices: countChoices(sum, system, rng, 5), pairs: cancellingPairs(system, cards) });
  }
  return { items };
}

/** Greedy list of [i, j] index pairs whose tags sum to zero. */
export function cancellingPairs(system, cards) {
  const used = new Set();
  const out = [];
  for (let i = 0; i < cards.length; i++) {
    if (used.has(i)) continue;
    const v = cardValue(system, cards[i]);
    if (v === 0) continue;
    for (let j = i + 1; j < cards.length; j++) {
      if (!used.has(j) && cardValue(system, cards[j]) === -v) {
        used.add(i);
        used.add(j);
        out.push([i, j]);
        break;
      }
    }
  }
  return out;
}

// ---------------------------------------------------------------- Unit 6: deck estimation

/**
 * Deck estimation: a discard tray holding `cardsInTray` cards out of a shoe of
 * `shoeDecks`. The learner answers in half decks.
 *   mode 'played'    → decks in the tray
 *   mode 'remaining' → decks left in the shoe
 *   precision        answer granularity in decks (0.5 by default)
 */
export function generateDeckEstimationDrill({ count = 12, shoeDecks = 6, mode = 'played', precision = 0.5, rng = Math.random }) {
  const items = [];
  for (let i = 0; i < count; i++) {
    const decks = shoeDecks === 'random' ? [1, 2, 4, 6, 8][Math.floor(rng() * 5)] : shoeDecks;
    // Between a quarter deck and the penetration limit, in random (not pre-rounded) amounts.
    const maxPlayed = decks * 52 * 0.85;
    const cardsInTray = Math.max(8, Math.round(13 + rng() * (maxPlayed - 13)));
    const played = cardsInTray / 52;
    const remaining = decks - played;
    const exact = mode === 'played' ? played : remaining;
    const answer = Math.max(precision, Math.round(exact / precision) * precision);
    const choices = estimateChoices(answer, precision, decks, rng);
    items.push({ cardsInTray, shoeDecks: decks, exact, answer, choices, mode });
  }
  return { items };
}

function estimateChoices(answer, step, maxDecks, rng) {
  const picks = new Set([answer]);
  let guard = 0;
  while (picks.size < 5 && guard++ < 100) {
    const off = (1 + Math.floor(rng() * 3)) * step * (rng() < 0.5 ? -1 : 1);
    const v = Math.round((answer + off) / step) * step;
    if (v >= step && v <= maxDecks) picks.add(v);
  }
  return [...picks].sort((a, b) => a - b);
}

// ---------------------------------------------------------------- Unit 7: true count

/**
 * True count conversion: running count ÷ decks remaining, truncated toward zero.
 * Items: { rc, decksLeft, tc, choices }.
 */
export function truncateTowardZero(x) {
  return x < 0 ? Math.ceil(x) : Math.floor(x);
}

export function generateTrueCountDrill({ count = 15, rng = Math.random, maxDecks = 6 }) {
  const items = [];
  const deckOptions = [];
  for (let d = 0.5; d <= maxDecks; d += 0.5) deckOptions.push(d);
  for (let i = 0; i < count; i++) {
    const decksLeft = deckOptions[Math.floor(rng() * deckOptions.length)];
    const rc = Math.round((rng() * 2 - 1) * Math.max(4, decksLeft * 5));
    const tc = truncateTowardZero(rc / decksLeft);
    const picks = new Set([tc]);
    let guard = 0;
    while (picks.size < 5 && guard++ < 50) picks.add(tc + (Math.floor(rng() * 7) - 3));
    items.push({ rc, decksLeft, tc, choices: [...picks].sort((a, b) => a - b) });
  }
  return { items };
}

// ---------------------------------------------------------------- Unit 8: bet ramp


/**
 * Bet sizing: given a count, pick the ramp's bet in units.
 * Balanced systems see a true count; unbalanced ones see a running count with
 * the key count and pivot for reference.
 */
export function generateBetDrill({ system, count = 15, decks = 6, rng = Math.random }) {
  const items = [];
  const key = system.balanced ? null : keyCount(system, decks);
  const pivot = system.pivot ?? 0;
  for (let i = 0; i < count; i++) {
    let item;
    if (system.balanced) {
      const tc = Math.floor(rng() * 10) - 3; // −3 … +6
      item = { trueCount: tc, correct: recommendedBet(system, { trueCount: tc }) };
    } else {
      const span = Math.max(4, pivot - key);
      const rc = key - span + Math.floor(rng() * (3 * span));
      item = { runningCount: rc, keyCount: key, pivot, decks, correct: recommendedBet(system, { runningCount: rc, decks }) };
    }
    item.choices = [...new Set(DEFAULT_RAMP.map((r) => r.units))].sort((a, b) => a - b);
    items.push(item);
  }
  return { items };
}

// ---------------------------------------------------------------- Unit 9: deviations


const DEVIATION_SETS = {
  insurance: ILLUSTRIOUS_18.filter((d) => d.id === 'ins'),
  i18a: ILLUSTRIOUS_18.filter((d) => d.when === 'atOrAbove' && d.id !== 'ins'),
  i18b: ILLUSTRIOUS_18.filter((d) => d.when === 'below'),
  fab4: FAB_4,
  mixed: [...ILLUSTRIOUS_18, ...FAB_4],
};

/** Build concrete cards for a deviation hand such as '16', '10,10' or 'Insurance'. */
export function cardsForDeviationHand(hand, rng = Math.random) {
  if (hand === 'Insurance') {
    const r = ['7', '8', '9', '10', 'K', '6', '5'][Math.floor(rng() * 7)];
    const r2 = ['2', '3', '4', '9', 'Q', 'J'][Math.floor(rng() * 6)];
    return [makeCard(r, 'S'), makeCard(r2, 'H')];
  }
  if (hand === '10,10') return [makeCard(['10', 'J', 'Q', 'K'][Math.floor(rng() * 4)], 'S'), makeCard(['10', 'J', 'Q', 'K'][Math.floor(rng() * 4)], 'H')];
  const total = Number(hand);
  const options = [];
  for (let a = 2; a <= 10; a++) {
    const b = total - a;
    if (b >= 2 && b <= 10 && a !== b) options.push([a, b]);
  }
  const [a, b] = options[Math.floor(rng() * options.length)];
  const rank = (v) => (v === 10 ? ['10', 'J', 'Q', 'K'][Math.floor(rng() * 4)] : String(v));
  return [makeCard(rank(a), 'S'), makeCard(rank(b), 'H')];
}

/**
 * Index-play drill: a hand, an upcard and a true count near the index.
 * Items: { deviation, cards, dealer, trueCount, correct, options: [action, fallback] }.
 */
export function generateDeviationDrill({ set = 'mixed', count = 12, rng = Math.random }) {
  const pool = DEVIATION_SETS[set] || DEVIATION_SETS.mixed;
  const items = [];
  for (let i = 0; i < count; i++) {
    const dev = pool[i % pool.length];
    const offset = Math.floor(rng() * 5) - 2; // −2 … +2 around the index
    const trueCount = dev.index + offset;
    const correct = deviationApplies(dev, trueCount) ? dev.action : dev.fallback;
    items.push({
      deviation: dev,
      cards: cardsForDeviationHand(dev.hand, rng),
      dealer: makeCard(dev.upcard, ['S', 'H', 'D', 'C'][Math.floor(rng() * 4)]),
      trueCount,
      correct,
      options: rng() < 0.5 ? [dev.action, dev.fallback] : [dev.fallback, dev.action],
    });
  }
  // Shuffle so the same deviation does not repeat back to back when the pool is small.
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return { items };
}
