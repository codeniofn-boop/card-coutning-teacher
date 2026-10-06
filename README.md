# CountUp

A gamified blackjack card-counting trainer, built the way Duolingo teaches languages: short lessons, a skill-tree path, streaks, XP, hearts and a lot of repetition. "CountUp" is a placeholder name.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # unit tests for the game logic
npm run build      # production build in dist/
```

Single-page React 19 + Tailwind 4 app built with Vite. All state lives in memory (reloading starts fresh); persistence can be added by serialising the store.

## What works today

- **Onboarding**: pick one of eight counting systems (Hi-Lo recommended), with a comparison screen.
- **Learning path**: 11 units with snake-style nodes. Lessons unlock in order; mastered skills decay over time and show as "needs review".
- **Unit 1 · Reality check**: an honest, short lesson on legality, edge size, variance and bankroll.
- **Unit 2 · Basic strategy**: hand-plus-upcard drills for hard totals, soft totals, pairs and surrender, plus a timed mixed sprint, with colour-coded charts and an S17/H17 toggle.
- **Unit 5 · Cancellation**: see a pair as one number, strike out cancelling cards in a hand and net the rest, then a timed sprint.
- **Unit 3 · Card values**: flashcards (untimed, timed, lightning).
- **Unit 4 · Running count**: count-along with multiple choice, auto-flashing singles, pairs and full hands with checkpoints, and a timed deck countdown.
- **Gamification**: XP with level titles, daily streak with automatic streak freezes, hearts lost on mistakes (regenerate every 30 minutes or refill via a review session), badges, adaptive drill speed, per-skill accuracy and best-time stats.
- **Feedback**: every completion screen lists exactly which card or checkpoint went wrong, what was entered versus what was correct, and can replay the full card sequence with the running count under each group.
- **Review**: a spaced-repetition tab that surfaces the weakest practised skills.

Everything else on the path (deck estimation, true count, bet spreading, deviations, full table, casino conditions) is stubbed with a "coming soon" preview so the structure is visible. Stub lessons never block the path.

## Project layout

```
src/
  game/                 pure game logic, no React
    cards.js            card primitives, hand values
    shoe.js             seeded RNG, shuffling, shoes with penetration
    countingSystems.js  all 8 systems (values, balance, BC/PE/IC, IRC)
    basicStrategy.js    multi-deck S17/H17 strategy tables
    deviations.js       Illustrious 18 and Fab 4 indices for Hi-Lo
    drills.js           drill generators and graders
  learning/
    units.js            the learning path: units, lessons, unlock rules
    progress.js         XP, levels, streaks, hearts, mastery decay, speed ramp
    badges.js           achievements
  state/store.jsx       reducer + React context, all in memory
  components/           playing card (CSS/SVG), buttons, keypad, confetti, …
  screens/              onboarding, path, systems, review, profile
  screens/lessons/      lesson runner, intro, drills, completion screen
tests/                  node:test suites for the pure modules
```

### Adding a counting system

Append an entry to `SYSTEMS` in `src/game/countingSystems.js`. A tag is a number, or `{ red, black }` when it depends on suit colour (see Red Seven). Set `balanced`, `aceSideCount` and the published correlations, and the rest of the app (drills, charts, comparison screen, unit availability) picks it up.

### Adding a lesson

Add a lesson to a unit in `src/learning/units.js` with a `type` that maps to a drill component in `src/screens/lessons/LessonRunner.jsx`. Drills receive `{ lesson, system, speedMs, onMistake, onFinish, onProgress }` and report `{ total, correct, mistakes, durationMs, trail? }`.
