/**
 * countingSystems.js — every supported counting system in one place.
 *
 * Adding a new system is a matter of appending an object to SYSTEMS:
 *   - `values` maps each rank to its tag. A tag is a number, or an object
 *     { red, black } when the value depends on the suit colour (Red Seven).
 *   - `balanced`: true when a full deck sums to 0 (needs true-count conversion).
 *   - `irc(decks)`: initial running count for a shoe of `decks` decks.
 *     Balanced systems start at 0; unbalanced ones start negative so that the
 *     running count alone approximates the true count near the pivot.
 *   - bc / pe / ic: betting correlation, playing efficiency and insurance
 *     correlation. These are the commonly published figures (Wizard of Odds,
 *     QFIT) and are approximate — treat them as a guide, not gospel.
 */

const TEN = { 10: -1, J: -1, Q: -1, K: -1 };
const TEN2 = { 10: -2, J: -2, Q: -2, K: -2 };

export const SYSTEMS = [
  {
    id: 'hilo',
    name: 'Hi-Lo',
    level: 'beginner',
    recommended: true,
    balanced: true,
    aceSideCount: false,
    bc: 0.97,
    pe: 0.51,
    ic: 0.76,
    tagline: 'The classic. Simple, strong, and what most books teach.',
    description:
      'Low cards (2–6) are +1, neutral cards (7–9) are 0 and tens and aces are −1. Balanced, so a full deck counts back to zero, and you convert to a true count by dividing by the decks remaining.',
    values: { A: -1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1, 7: 0, 8: 0, 9: 0, ...TEN },
    irc: () => 0,
  },
  {
    id: 'ko',
    name: 'KO (Knock-Out)',
    shortName: 'KO',
    level: 'beginner',
    balanced: false,
    aceSideCount: false,
    bc: 0.98,
    pe: 0.55,
    ic: 0.78,
    tagline: 'Like Hi-Lo but 7s count too, so you never divide.',
    description:
      'Counts 2–7 as +1, 8–9 as 0 and 10–A as −1. The extra +1 on the 7 makes it unbalanced: start the count at 4 − 4 × decks and bet when the running count crosses the key count. No true-count conversion needed.',
    values: { A: -1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1, 7: 1, 8: 0, 9: 0, ...TEN },
    irc: (decks) => 4 - 4 * decks,
    pivot: 4,
  },
  {
    id: 'red7',
    name: 'Red Seven',
    level: 'beginner',
    balanced: false,
    aceSideCount: false,
    bc: 0.98,
    pe: 0.54,
    ic: 0.78,
    tagline: 'Hi-Lo with a twist: red 7s are +1, black 7s are 0.',
    description:
      'Identical to Hi-Lo except red sevens count +1 (black sevens stay 0). That half-step makes the system unbalanced, so like KO it skips the true-count division. Start at −2 × decks; the pivot is 0.',
    values: { A: -1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1, 7: { red: 1, black: 0 }, 8: 0, 9: 0, ...TEN },
    irc: (decks) => -2 * decks,
    pivot: 0,
  },
  {
    id: 'hiopt1',
    name: 'Hi-Opt I',
    level: 'intermediate',
    balanced: true,
    aceSideCount: true,
    bc: 0.88,
    pe: 0.61,
    ic: 0.85,
    tagline: 'Aces are neutral, so you side-count them for betting.',
    description:
      'Counts 3–6 as +1 and tens as −1; aces, 2s and 7–9 are 0. Better playing decisions than Hi-Lo, but because the ace is neutral you should keep a separate ace side count to size bets well.',
    values: { A: 0, 2: 0, 3: 1, 4: 1, 5: 1, 6: 1, 7: 0, 8: 0, 9: 0, ...TEN },
    irc: () => 0,
  },
  {
    id: 'hiopt2',
    name: 'Hi-Opt II',
    level: 'advanced',
    balanced: true,
    aceSideCount: true,
    bc: 0.91,
    pe: 0.67,
    ic: 0.91,
    tagline: 'A level-2 count with the best playing efficiency around.',
    description:
      'Uses two tag values: 2, 3, 6, 7 are +1; 4 and 5 are +2; tens are −2; aces, 8s and 9s are 0. Excellent for playing decisions and insurance, and pairs with an ace side count for betting.',
    values: { A: 0, 2: 1, 3: 1, 4: 2, 5: 2, 6: 1, 7: 1, 8: 0, 9: 0, ...TEN2 },
    irc: () => 0,
  },
  {
    id: 'omega2',
    name: 'Omega II',
    level: 'advanced',
    balanced: true,
    aceSideCount: true,
    bc: 0.92,
    pe: 0.67,
    ic: 0.85,
    tagline: 'Bryce Carlson’s level-2 system, strong all round.',
    description:
      '2, 3, 7 are +1; 4, 5, 6 are +2; 9 is −1; tens are −2; aces and 8s are 0. A balanced level-2 count that trades some simplicity for strong playing and insurance accuracy.',
    values: { A: 0, 2: 1, 3: 1, 4: 2, 5: 2, 6: 2, 7: 1, 8: 0, 9: -1, ...TEN2 },
    irc: () => 0,
  },
  {
    id: 'zen',
    name: 'Zen Count',
    level: 'advanced',
    balanced: true,
    aceSideCount: false,
    bc: 0.96,
    pe: 0.63,
    ic: 0.85,
    tagline: 'Arnold Snyder’s level-2 count — no ace side count needed.',
    description:
      '2, 3, 7 are +1; 4, 5, 6 are +2; tens are −2; aces are −1; 8s and 9s are 0. Because the ace carries a value you get good betting correlation without a side count.',
    values: { A: -1, 2: 1, 3: 1, 4: 2, 5: 2, 6: 2, 7: 1, 8: 0, 9: 0, ...TEN2 },
    irc: () => 0,
  },
  {
    id: 'halves',
    name: 'Wong Halves',
    level: 'expert',
    balanced: true,
    aceSideCount: false,
    bc: 0.99,
    pe: 0.56,
    ic: 0.72,
    tagline: 'Fractional tags for near-perfect betting. Hard to run fast.',
    description:
      '2 and 7 are +½; 3, 4, 6 are +1; 5 is +1½; 8 is 0; 9 is −½; tens and aces are −1. Many players double every tag to count in whole numbers and halve the result. The best betting correlation of any popular system.',
    values: { A: -1, 2: 0.5, 3: 1, 4: 1, 5: 1.5, 6: 1, 7: 0.5, 8: 0, 9: -0.5, ...TEN },
    irc: () => 0,
  },
];

export const LEVEL_ORDER = ['beginner', 'intermediate', 'advanced', 'expert'];

export function getSystem(id) {
  return SYSTEMS.find((s) => s.id === id) || SYSTEMS[0];
}

/** Value of a rank in `system`; suit matters only for colour-dependent tags. */
export function rankValue(system, rank, suit) {
  const tag = system.values[rank];
  if (typeof tag === 'number') return tag;
  const isRed = suit === 'H' || suit === 'D';
  return isRed ? tag.red : tag.black;
}

export function cardValue(system, card) {
  return rankValue(system, card.rank, card.suit);
}

/** Running count after `cards`, starting from `start`. */
export function runningCount(system, cards, start = 0) {
  let count = start;
  for (const card of cards) count += cardValue(system, card);
  return roundCount(count);
}

/** Running count after each card: [after 1st, after 2nd, …]. */
export function runningCountTrail(system, cards, start = 0) {
  const trail = [];
  let count = start;
  for (const card of cards) {
    count = roundCount(count + cardValue(system, card));
    trail.push(count);
  }
  return trail;
}

/** Avoid floating point drift with half-value systems. */
export function roundCount(n) {
  return Math.round(n * 2) / 2;
}

/** True for systems with fractional tags (Wong Halves). */
export function hasHalfValues(system) {
  return distinctValues(system).some((v) => !Number.isInteger(v));
}

/** Sorted unique tag values, e.g. [-1, 0, 1] for Hi-Lo. */
export function distinctValues(system) {
  const set = new Set();
  for (const tag of Object.values(system.values)) {
    if (typeof tag === 'number') set.add(tag);
    else {
      set.add(tag.red);
      set.add(tag.black);
    }
  }
  return [...set].sort((a, b) => a - b);
}

/**
 * Groups ranks by tag value for display, e.g.
 *   [{ value: 1, ranks: [{rank:'2'}, …, {rank:'7', color:'red'}] }, …]
 * `color` is only set when the tag depends on suit colour.
 */
export function valueGroups(system) {
  const order = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  const groups = new Map();
  const push = (value, entry) => {
    if (!groups.has(value)) groups.set(value, []);
    groups.get(value).push(entry);
  };
  for (const rank of order) {
    const tag = system.values[rank];
    if (typeof tag === 'number') push(tag, { rank });
    else {
      push(tag.red, { rank, color: 'red' });
      push(tag.black, { rank, color: 'black' });
    }
  }
  return [...groups.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([value, ranks]) => ({ value, ranks }));
}

/** "+1", "0", "−2", "+½". Uses a real minus sign so it reads well on cards. */
export function formatCount(n) {
  if (n === 0) return '0';
  const sign = n > 0 ? '+' : '−';
  const abs = Math.abs(n);
  const whole = Math.floor(abs);
  const half = abs - whole === 0.5;
  let body = whole === 0 ? '' : String(whole);
  if (half) body += '½';
  return `${sign}${body}`;
}

/** True count = running count ÷ decks remaining. Only meaningful for balanced systems. */
export function trueCount(rc, decksLeft) {
  if (decksLeft <= 0) return rc;
  return rc / decksLeft;
}

/** Initial running count for a shoe of `decks` decks. */
export function initialRunningCount(system, decks) {
  return system.irc ? system.irc(decks) : 0;
}

/** Sum of tags over one full deck — 0 for balanced systems, positive for unbalanced ones. */
export function deckSum(system) {
  let sum = 0;
  for (const rank of Object.keys(system.values)) {
    for (const suit of ['S', 'H', 'D', 'C']) sum += rankValue(system, rank, suit);
  }
  return roundCount(sum);
}
