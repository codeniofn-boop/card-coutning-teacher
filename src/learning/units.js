/**
 * units.js — the learning path.
 *
 * The path is a list of units; each unit is a list of lessons. A lesson has:
 *   id        stable identifier, used as the skill key in progress tracking
 *   title     short name shown on the path node
 *   blurb     one-line description shown in the lesson sheet
 *   type      which drill runs it:
 *               'strategy'      Unit 2 basic strategy hands
 *               'cardValues'    Unit 3 flashcards
 *               'runningCount'  Unit 4 drills (see config.mode)
 *               'cancellation'  Unit 5 drills (see config.mode)
 *               'reading'       text pages with quick checks (content in readings.js)
 *               'deckEstimation' | 'trueCount' | 'bet' | 'deviation'   Units 6–9 multiple-choice drills
 *               'table'         Unit 10/11 full-table simulator
 *               'stub'          not built yet — shows a "coming soon" sheet
 *   config    drill-specific settings (counts, speeds)
 *   xp        base XP for a pass
 *   goal      the stat target shown to the user (optional)
 *   passAccuracy  minimum accuracy to count as a pass (default 0.8)
 *
 * Units can be restricted by counting system:
 *   requires: 'balanced'  → skipped for unbalanced systems (true count conversion)
 *   systems: ['hilo']     → only available for those systems (deviation indices)
 *
 * Unlock rule: a lesson is available once every earlier *implemented* lesson
 * in an *available* unit has been completed. Stub lessons never block the
 * path, so the structure is visible while the rest gets built.
 */

export const UNITS = [
  {
    id: 'basics',
    number: 1,
    title: 'Blackjack basics',
    icon: '🃏',
    blurb: 'Rules, hand values, dealer rules and payouts. The table before the count.',
    lessons: [
      { id: 'basics-flow', title: 'How a hand plays', blurb: 'From placing a bet to the dealer turning over the hole card.', type: 'reading', xp: 10 },
      { id: 'basics-values', title: 'Hand values', blurb: 'Hard totals, soft totals and why the ace is special.', type: 'reading', xp: 10 },
      { id: 'basics-dealer', title: 'H17 vs S17', blurb: 'Dealer rules, and why hitting soft 17 costs you money.', type: 'reading', xp: 10 },
      { id: 'basics-payouts', title: 'Payouts', blurb: '3:2 versus 6:5 blackjack, insurance and even money.', type: 'reading', xp: 10 },
      { id: 'basics-reality', title: 'Reality check', blurb: 'What counting can and cannot do for you. Short and honest.', type: 'reading', xp: 15 },
    ],
  },
  {
    id: 'strategy',
    number: 2,
    title: 'Basic strategy',
    icon: '📋',
    blurb: 'The mathematically best play for every hand. Counting is built on top of this.',
    lessons: [
      {
        id: 'strategy-hard',
        title: 'Hard totals',
        blurb: 'Hit, stand or double with no ace in play.',
        type: 'strategy',
        config: { category: 'hard', count: 15 },
        xp: 15,
        goal: '15 hard hands with 80% accuracy',
      },
      {
        id: 'strategy-soft',
        title: 'Soft totals',
        blurb: 'Hands with an ace counted as 11.',
        type: 'strategy',
        config: { category: 'soft', count: 15 },
        xp: 15,
        goal: '15 soft hands with 80% accuracy',
      },
      {
        id: 'strategy-pairs',
        title: 'Pairs',
        blurb: 'When to split and when to leave them alone.',
        type: 'strategy',
        config: { category: 'pairs', count: 15 },
        xp: 15,
        goal: '15 pairs with 80% accuracy',
      },
      {
        id: 'strategy-surrender',
        title: 'Surrender',
        blurb: 'Giving up half a bet is sometimes the best play.',
        type: 'strategy',
        config: { category: 'surrender', count: 12 },
        xp: 15,
        goal: '12 stiff hands with 80% accuracy',
      },
      {
        id: 'strategy-mixed',
        title: 'Strategy sprint',
        blurb: 'Random hands against a clock.',
        type: 'strategy',
        config: { category: 'mixed', count: 25, timed: true, baseSpeedMs: 5000, minSpeedMs: 1500 },
        xp: 25,
        goal: '25 mixed hands at 5 seconds each with 90% accuracy',
        passAccuracy: 0.9,
      },
    ],
  },
  {
    id: 'values',
    number: 3,
    title: 'Card values',
    icon: '🔢',
    blurb: 'Learn your system’s tag for every card until it is a reflex.',
    lessons: [
      {
        id: 'values-learn',
        title: 'Learn the values',
        blurb: 'A single card at a time, no clock. Tap the tag.',
        type: 'cardValues',
        config: { count: 16, timed: false },
        xp: 15,
        goal: 'Tag 16 cards with 80% accuracy',
      },
      {
        id: 'values-quick',
        title: 'Quick draw',
        blurb: 'Same drill, now with a timer on every card.',
        type: 'cardValues',
        config: { count: 24, timed: true, baseSpeedMs: 2500, minSpeedMs: 900 },
        xp: 20,
        goal: 'Tag 24 cards at 2.5 seconds each',
      },
      {
        id: 'values-lightning',
        title: 'Lightning values',
        blurb: 'Forty cards, fast. This is where it becomes automatic.',
        type: 'cardValues',
        config: { count: 40, timed: true, baseSpeedMs: 1500, minSpeedMs: 500 },
        xp: 25,
        goal: '40 cards at 1.5 seconds each with 95% accuracy',
        passAccuracy: 0.95,
      },
    ],
  },
  {
    id: 'running',
    number: 4,
    title: 'Running count',
    icon: '🧮',
    blurb: 'Keep a running total as cards fly by, from single cards to full hands to a whole deck.',
    lessons: [
      {
        id: 'running-along',
        title: 'Count along',
        blurb: 'One card at a time. Pick the new running count after each.',
        type: 'runningCount',
        config: { mode: 'countAlong', count: 12 },
        xp: 15,
        goal: '12 cards with 80% accuracy',
      },
      {
        id: 'running-singles',
        title: 'One at a time',
        blurb: 'Cards flash automatically. Enter the count at each checkpoint.',
        type: 'runningCount',
        config: { mode: 'flash', groups: 20, groupSize: 1, checkpointEvery: 4, baseSpeedMs: 1400, minSpeedMs: 400 },
        xp: 20,
        goal: '20 cards at 1.4 seconds each, 5 checkpoints',
        passAccuracy: 0.7,
      },
      {
        id: 'running-pairs',
        title: 'Pairs',
        blurb: 'Two cards per flash. Start seeing the pair as one number.',
        type: 'runningCount',
        config: { mode: 'flash', groups: 12, groupSize: 2, checkpointEvery: 3, baseSpeedMs: 1800, minSpeedMs: 600 },
        xp: 20,
        goal: '12 pairs at 1.8 seconds each, 4 checkpoints',
        passAccuracy: 0.7,
      },
      {
        id: 'running-hands',
        title: 'Full hands',
        blurb: 'Three to five cards at once, like a hand on the table.',
        type: 'runningCount',
        config: { mode: 'flash', groups: 8, groupSize: [3, 5], checkpointEvery: 2, baseSpeedMs: 2800, minSpeedMs: 1000 },
        xp: 25,
        goal: '8 hands at 2.8 seconds each, 4 checkpoints',
        passAccuracy: 0.7,
      },
      {
        id: 'running-deck',
        title: 'Deck countdown',
        blurb: 'A whole deck minus a few cards. The classic counter’s test.',
        type: 'runningCount',
        config: { mode: 'deckCountdown', baseSpeedMs: 700, minSpeedMs: 250, targetMs: 25000 },
        xp: 30,
        goal: 'Count a single deck in under 25 seconds with 100% accuracy',
        passAccuracy: 1,
      },
    ],
  },
  {
    id: 'cancel',
    number: 5,
    title: 'Cancellation',
    icon: '🤝',
    blurb: 'Spot pairs that cancel out (a 5 and a king) so you count faster.',
    lessons: [
      {
        id: 'cancel-pairs',
        title: 'Canceling pairs',
        blurb: 'Two cards at a time. See the pair as one number, often zero.',
        type: 'cancellation',
        config: { mode: 'pairs', count: 16, handSize: 2 },
        xp: 15,
        goal: '16 pairs with 80% accuracy',
      },
      {
        id: 'cancel-hands',
        title: 'Cancel the hand',
        blurb: 'Tap the cards that cancel each other, then count what is left.',
        type: 'cancellation',
        config: { mode: 'strike', count: 10, handSize: [4, 6] },
        xp: 20,
        goal: '10 hands with 80% accuracy',
      },
      {
        id: 'cancel-speed',
        title: 'Cancel sprint',
        blurb: 'Full hands against the clock. Cancel in your head and tap the total.',
        type: 'cancellation',
        config: { mode: 'sprint', count: 20, handSize: [4, 7], timed: true, baseSpeedMs: 4000, minSpeedMs: 1200 },
        xp: 25,
        goal: '20 hands at 4 seconds each with 90% accuracy',
        passAccuracy: 0.9,
      },
    ],
  },
  {
    id: 'decks',
    number: 6,
    title: 'Deck estimation',
    icon: '🗂️',
    blurb: 'Eyeball the discard tray and know how many decks are left.',
    lessons: [
      { id: 'decks-tray', title: 'Read the tray', blurb: 'Estimate decks played from the discard stack, with deck marks to help.', type: 'deckEstimation', config: { count: 12, shoeDecks: 6, mode: 'played', precision: 0.5, reference: true }, xp: 15, goal: '12 trays to the nearest half deck' },
      { id: 'decks-remaining', title: 'Decks remaining', blurb: 'No marks this time. From decks played to decks left in a 6-deck shoe.', type: 'deckEstimation', config: { count: 12, shoeDecks: 6, mode: 'remaining', precision: 0.5 }, xp: 20, goal: '12 trays, decks remaining to the nearest half deck' },
      { id: 'decks-half', title: 'Half-deck precision', blurb: 'Any shoe size, against a clock.', type: 'deckEstimation', config: { count: 16, shoeDecks: 'random', mode: 'remaining', precision: 0.5, timed: true, baseSpeedMs: 4000, minSpeedMs: 1500 }, xp: 25, goal: '16 trays at 4 seconds each with 90% accuracy', passAccuracy: 0.9 },
    ],
  },
  {
    id: 'truecount',
    number: 7,
    title: 'True count',
    icon: '➗',
    blurb: 'Running count ÷ decks remaining. The number your bets and plays are based on.',
    requires: 'balanced',
    lessons: [
      { id: 'tc-why', title: 'Why divide?', blurb: 'A +6 with one deck left is not the same as +6 with five.', type: 'reading', xp: 15 },
      { id: 'tc-convert', title: 'Convert it', blurb: 'Running count and decks left in, true count out.', type: 'trueCount', config: { count: 15 }, xp: 20, goal: '15 conversions with 80% accuracy' },
      { id: 'tc-speed', title: 'Convert at speed', blurb: 'Fast conversions, rounded toward zero the way counters round.', type: 'trueCount', config: { count: 20, timed: true, baseSpeedMs: 3500, minSpeedMs: 1200 }, xp: 25, goal: '20 conversions at 3.5 seconds each with 90% accuracy', passAccuracy: 0.9 },
    ],
  },
  {
    id: 'betting',
    number: 8,
    title: 'Bet spreading',
    icon: '💰',
    blurb: 'Turn the true count into a bet, and understand bankroll and risk of ruin.',
    lessons: [
      { id: 'bet-units', title: 'Betting units', blurb: 'Why bets are sized in units, not dollars.', type: 'reading', xp: 15 },
      { id: 'bet-ramp', title: 'The bet ramp', blurb: 'Map each count to a bet from 1 to 8 units.', type: 'bet', config: { count: 15, decks: 6 }, xp: 20, goal: '15 bets with 80% accuracy' },
      { id: 'bet-ror', title: 'Risk of ruin', blurb: 'Bankroll, variance and how fast you can go broke.', type: 'reading', xp: 20 },
    ],
  },
  {
    id: 'deviations',
    number: 9,
    title: 'Playing deviations',
    icon: '🧠',
    blurb: 'The Illustrious 18 and Fab 4: when the count says to break basic strategy.',
    systems: ['hilo'],
    lessons: [
      { id: 'dev-insurance', title: 'Insurance at +3', blurb: 'The single most valuable deviation.', type: 'reading', xp: 15 },
      { id: 'dev-i18a', title: 'Illustrious 18, part 1', blurb: 'Stand, double and split indices at positive counts.', type: 'deviation', config: { set: 'i18a', count: 12 }, xp: 20, goal: '12 index plays with 80% accuracy' },
      { id: 'dev-i18b', title: 'Illustrious 18, part 2', blurb: 'Negative indices: when to hit a stiff you would normally stand on.', type: 'deviation', config: { set: 'i18b', count: 10 }, xp: 20, goal: '10 index plays with 80% accuracy' },
      { id: 'dev-fab4', title: 'Fab 4 surrenders', blurb: 'Four surrender indices worth learning.', type: 'deviation', config: { set: 'fab4', count: 8 }, xp: 20, goal: '8 index plays with 80% accuracy' },
      { id: 'dev-drill', title: 'Index drill', blurb: 'All 22 plays, random counts, against a clock.', type: 'deviation', config: { set: 'mixed', count: 22, timed: true, baseSpeedMs: 5000, minSpeedMs: 1500 }, xp: 25, goal: '22 index plays at 5 seconds each with 90% accuracy', passAccuracy: 0.9 },
    ],
  },
  {
    id: 'table',
    number: 10,
    title: 'Full table',
    icon: '🎰',
    blurb: 'A realistic table with other players. Count, bet, play and get graded.',
    lessons: [
      { id: 'table-solo', title: 'Heads up', blurb: 'Just you and the dealer, two decks, slow speed.', type: 'table', config: { decks: 2, penetration: 0.75, players: 0, rounds: 6, checkEvery: 2, baseSpeedMs: 1200, minSpeedMs: 350 }, xp: 30, goal: '6 rounds with 80% on counts, bets and plays' },
      { id: 'table-crowd', title: 'Crowded table', blurb: 'Four other players, six decks, cards everywhere.', type: 'table', config: { decks: 6, penetration: 0.75, players: 4, rounds: 8, checkEvery: 2, baseSpeedMs: 900, minSpeedMs: 300 }, xp: 35, goal: '8 rounds with 80% on counts, bets and plays' },
      { id: 'table-shoe', title: 'Full shoe', blurb: 'Six decks to the cut card, graded on count, bets and plays.', type: 'table', config: { decks: 6, penetration: 0.75, players: 5, rounds: 'shoe', checkEvery: 3, baseSpeedMs: 800, minSpeedMs: 250 }, xp: 50, goal: 'A whole shoe with every count check right' },
    ],
  },
  {
    id: 'casino',
    number: 11,
    title: 'Casino conditions',
    icon: '🕶️',
    blurb: 'Distractions, chatter, fast dealers, and how not to look like a counter.',
    lessons: [
      { id: 'casino-noise', title: 'Distraction mode', blurb: 'Count through chatter, dealer talk and an uneven rhythm.', type: 'runningCount', config: { mode: 'flash', groups: 14, groupSize: [2, 4], checkpointEvery: 3, baseSpeedMs: 2200, minSpeedMs: 800, distract: true }, xp: 30, goal: '14 hands with chatter, 70% of checkpoints right', passAccuracy: 0.7 },
      { id: 'casino-fast', title: 'Fast dealer', blurb: 'Real casino dealing speed: a hand every 1.3 seconds.', type: 'runningCount', config: { mode: 'flash', groups: 16, groupSize: [2, 4], checkpointEvery: 4, baseSpeedMs: 1300, minSpeedMs: 500 }, xp: 30, goal: '16 hands at 1.3 seconds each, 70% of checkpoints right', passAccuracy: 0.7 },
      { id: 'casino-crowd-noise', title: 'Noisy full table', blurb: 'The full table simulator with chatter and interruptions.', type: 'table', config: { decks: 6, penetration: 0.7, players: 5, rounds: 8, checkEvery: 2, baseSpeedMs: 700, minSpeedMs: 250, distract: true }, xp: 40, goal: '8 noisy rounds with 80% on counts, bets and plays' },
      { id: 'casino-camo', title: 'Camouflage', blurb: 'Bet and act in ways that keep you at the table.', type: 'reading', xp: 20 },
    ],
  },
];

/** Flat list of every lesson with a back-reference to its unit. */
export const LESSONS = UNITS.flatMap((unit) => unit.lessons.map((lesson) => ({ ...lesson, unitId: unit.id })));

/**
 * Free-play modes live outside the path. They never cost hearts, still earn
 * XP and badges, and take their config from the screen that launches them.
 */
export const FREE_PLAY = [
  {
    id: 'deck-dash',
    unitId: 'running',
    title: 'Deck Dash',
    blurb: 'A whole deck (or several) flashes past in the time you choose. Keep the count and enter it at the end.',
    type: 'runningCount',
    noHearts: true,
    config: { mode: 'deckCountdown', decks: 1, removed: 1, baseSpeedMs: 600, minSpeedMs: 150, fixedSpeed: true, targetMs: 30000 },
    xp: 20,
    goal: 'Count every card before the clock runs out',
    passAccuracy: 1,
  },
];

export function getLesson(id) {
  return LESSONS.find((l) => l.id === id) || FREE_PLAY.find((l) => l.id === id) || null;
}

export function getUnit(id) {
  return UNITS.find((u) => u.id === id) || null;
}

export function isImplemented(lesson) {
  return lesson.type !== 'stub';
}

/**
 * Is this unit part of the path for `system`?
 * Returns { available, reason } where reason explains a skip.
 */
export function unitAvailability(unit, system) {
  if (unit.requires === 'balanced' && !system.balanced) {
    return { available: false, reason: `${system.shortName || system.name} is unbalanced, so there is no true-count conversion. Skipped.` };
  }
  if (unit.systems && !unit.systems.includes(system.id)) {
    return { available: false, reason: `Index numbers are available for Hi-Lo only for now.` };
  }
  return { available: true, reason: null };
}

/** Ordered lessons that actually apply to a system (skipped units removed). */
export function lessonsForSystem(system) {
  return UNITS.filter((u) => unitAvailability(u, system).available).flatMap((u) => u.lessons.map((l) => ({ ...l, unitId: u.id })));
}

/**
 * Lesson status for the path:
 *   'completed' | 'available' | 'locked' | 'soon' (stub) | 'skipped' (unit not in this track)
 */
export function lessonStatus(lessonId, track, system, unlockAll = false) {
  const unit = UNITS.find((u) => u.lessons.some((l) => l.id === lessonId));
  if (!unitAvailability(unit, system).available) return 'skipped';
  const lessons = lessonsForSystem(system);
  const idx = lessons.findIndex((l) => l.id === lessonId);
  const lesson = lessons[idx];
  if (!isImplemented(lesson)) return 'soon';
  const skills = track?.skills || {};
  if (skills[lessonId]?.completions > 0) return 'completed';
  if (unlockAll) return 'available';
  for (let i = 0; i < idx; i++) {
    const prev = lessons[i];
    if (isImplemented(prev) && !(skills[prev.id]?.completions > 0)) return 'locked';
  }
  return 'available';
}

/** The next lesson the user should take, or null when everything built is done. */
export function nextLesson(track, system, unlockAll = false) {
  return lessonsForSystem(system).find((l) => lessonStatus(l.id, track, system, unlockAll) === 'available') || null;
}

/** Progress summary for a unit: { done, total } over implemented lessons. */
export function unitProgress(unit, track) {
  const built = unit.lessons.filter(isImplemented);
  const done = built.filter((l) => track?.skills?.[l.id]?.completions > 0).length;
  return { done, total: built.length, built: built.length > 0 };
}
