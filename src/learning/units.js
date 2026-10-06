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
 *               'reality'       the short honest-framing lesson
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
      { id: 'basics-flow', title: 'How a hand plays', blurb: 'From placing a bet to the dealer turning over the hole card.', type: 'stub', xp: 10 },
      { id: 'basics-values', title: 'Hand values', blurb: 'Hard totals, soft totals and why the ace is special.', type: 'stub', xp: 10 },
      { id: 'basics-dealer', title: 'H17 vs S17', blurb: 'Dealer rules, and why hitting soft 17 costs you money.', type: 'stub', xp: 10 },
      { id: 'basics-payouts', title: 'Payouts', blurb: '3:2 versus 6:5 blackjack, insurance and even money.', type: 'stub', xp: 10 },
      { id: 'basics-reality', title: 'Reality check', blurb: 'What counting can and cannot do for you. Short and honest.', type: 'reality', xp: 15 },
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
      { id: 'cancel-pairs', title: 'Canceling pairs', blurb: 'Which two cards add to zero?', type: 'stub', xp: 15 },
      { id: 'cancel-hands', title: 'Cancel the hand', blurb: 'Strike out the pairs, count what is left.', type: 'stub', xp: 20 },
      { id: 'cancel-speed', title: 'Cancel sprint', blurb: 'Full hands at speed using cancellation.', type: 'stub', xp: 25 },
    ],
  },
  {
    id: 'decks',
    number: 6,
    title: 'Deck estimation',
    icon: '🗂️',
    blurb: 'Eyeball the discard tray and know how many decks are left.',
    lessons: [
      { id: 'decks-tray', title: 'Read the tray', blurb: 'Estimate decks played from the discard stack.', type: 'stub', xp: 15 },
      { id: 'decks-remaining', title: 'Decks remaining', blurb: 'From decks played to decks left in the shoe.', type: 'stub', xp: 20 },
      { id: 'decks-half', title: 'Half-deck precision', blurb: 'Estimate to the nearest half deck.', type: 'stub', xp: 25 },
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
      { id: 'tc-why', title: 'Why divide?', blurb: 'A +6 with one deck left is not the same as +6 with five.', type: 'stub', xp: 15 },
      { id: 'tc-convert', title: 'Convert it', blurb: 'Running count and decks left in, true count out.', type: 'stub', xp: 20 },
      { id: 'tc-speed', title: 'Convert at speed', blurb: 'Fast conversions, rounded the way counters round.', type: 'stub', xp: 25 },
    ],
  },
  {
    id: 'betting',
    number: 8,
    title: 'Bet spreading',
    icon: '💰',
    blurb: 'Turn the true count into a bet, and understand bankroll and risk of ruin.',
    lessons: [
      { id: 'bet-units', title: 'Betting units', blurb: 'Why bets are sized in units, not dollars.', type: 'stub', xp: 15 },
      { id: 'bet-ramp', title: 'The bet ramp', blurb: 'Map each true count to a bet.', type: 'stub', xp: 20 },
      { id: 'bet-ror', title: 'Risk of ruin', blurb: 'Bankroll, variance and how fast you can go broke.', type: 'stub', xp: 20 },
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
      { id: 'dev-insurance', title: 'Insurance at +3', blurb: 'The single most valuable deviation.', type: 'stub', xp: 15 },
      { id: 'dev-i18a', title: 'Illustrious 18, part 1', blurb: 'Stand and double indices.', type: 'stub', xp: 20 },
      { id: 'dev-i18b', title: 'Illustrious 18, part 2', blurb: 'Negative indices and splits.', type: 'stub', xp: 20 },
      { id: 'dev-fab4', title: 'Fab 4 surrenders', blurb: 'Four surrender indices worth learning.', type: 'stub', xp: 20 },
      { id: 'dev-drill', title: 'Index drill', blurb: 'Hand, upcard, true count. What is the play?', type: 'stub', xp: 25 },
    ],
  },
  {
    id: 'table',
    number: 10,
    title: 'Full table',
    icon: '🎰',
    blurb: 'A realistic table with other players. Count, bet, play and get graded.',
    lessons: [
      { id: 'table-solo', title: 'Heads up', blurb: 'Just you and the dealer, slow speed.', type: 'stub', xp: 30 },
      { id: 'table-crowd', title: 'Crowded table', blurb: 'Five other players, cards everywhere.', type: 'stub', xp: 35 },
      { id: 'table-shoe', title: 'Full shoe', blurb: 'Six decks, 75% penetration, graded on count, bets and plays.', type: 'stub', xp: 50 },
    ],
  },
  {
    id: 'casino',
    number: 11,
    title: 'Casino conditions',
    icon: '🕶️',
    blurb: 'Distractions, chatter, fast dealers, and how not to look like a counter.',
    lessons: [
      { id: 'casino-noise', title: 'Distraction mode', blurb: 'Count through chatter and dealer talk.', type: 'stub', xp: 30 },
      { id: 'casino-fast', title: 'Fast dealer', blurb: 'Real casino dealing speed.', type: 'stub', xp: 30 },
      { id: 'casino-camo', title: 'Camouflage', blurb: 'Bet and act in ways that keep you at the table.', type: 'stub', xp: 20 },
    ],
  },
];

/** Flat list of every lesson with a back-reference to its unit. */
export const LESSONS = UNITS.flatMap((unit) => unit.lessons.map((lesson) => ({ ...lesson, unitId: unit.id })));

export function getLesson(id) {
  return LESSONS.find((l) => l.id === id) || null;
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
export function lessonStatus(lessonId, track, system) {
  const unit = UNITS.find((u) => u.lessons.some((l) => l.id === lessonId));
  if (!unitAvailability(unit, system).available) return 'skipped';
  const lessons = lessonsForSystem(system);
  const idx = lessons.findIndex((l) => l.id === lessonId);
  const lesson = lessons[idx];
  if (!isImplemented(lesson)) return 'soon';
  const skills = track?.skills || {};
  if (skills[lessonId]?.completions > 0) return 'completed';
  for (let i = 0; i < idx; i++) {
    const prev = lessons[i];
    if (isImplemented(prev) && !(skills[prev.id]?.completions > 0)) return 'locked';
  }
  return 'available';
}

/** The next lesson the user should take, or null when everything built is done. */
export function nextLesson(track, system) {
  return lessonsForSystem(system).find((l) => lessonStatus(l.id, track, system) === 'available') || null;
}

/** Progress summary for a unit: { done, total } over implemented lessons. */
export function unitProgress(unit, track) {
  const built = unit.lessons.filter(isImplemented);
  const done = built.filter((l) => track?.skills?.[l.id]?.completions > 0).length;
  return { done, total: built.length, built: built.length > 0 };
}
