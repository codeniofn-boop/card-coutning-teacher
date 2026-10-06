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

Every unit on the path is playable. Lessons unlock in order; the "Unlock every lesson" switch in Profile lets you jump anywhere and practise without hearts.

- **Onboarding** picks one of eight counting systems (Hi-Lo recommended) with a comparison screen.
- **Unit 1 · Blackjack basics**: five short reading lessons with quick checks, including the honest Reality check.
- **Unit 2 · Basic strategy**: hand-plus-upcard drills for hard totals, soft totals, pairs and surrender, plus a timed sprint, with colour-coded charts and an S17/H17 toggle.
- **Unit 3 · Card values**: flashcards (untimed, timed, lightning).
- **Unit 4 · Running count**: count-along, auto-flashing singles, pairs and hands with checkpoints, and a timed deck countdown.
- **Unit 5 · Cancellation**: pairs as one number, strike out cancelling cards, timed sprint.
- **Unit 6 · Deck estimation**: a CSS discard tray; estimate decks played and remaining to the nearest half deck.
- **Unit 7 · True count** (balanced systems only): why divide, conversions, timed conversions.
- **Unit 8 · Bet spreading**: units, a 1–8 ramp drill (running-count based for KO and Red Seven), and an interactive risk-of-ruin page.
- **Unit 9 · Playing deviations** (Hi-Lo): insurance at +3, Illustrious 18 in two parts, Fab 4, and a timed index drill.
- **Unit 10 · Full table**: a simulator with configurable decks, penetration, other players and speed. You bet, play and keep the count; every bet, play and count check is graded and shown alongside the book answer.
- **Unit 11 · Casino conditions**: distraction mode with chatter and uneven rhythm, a fast dealer, a noisy full table, and camouflage tips.
- **Gamification**: XP and levels, daily streak with automatic streak freezes, hearts (regenerate every 30 minutes or refill via review), 15 badges, adaptive drill speed, per-skill accuracy and best-time stats.
- **Feedback**: completion screens list exactly which card, hand or checkpoint went wrong, what was entered versus what was correct, and can replay the full card sequence.
- **Review**: a spaced-repetition tab that surfaces the weakest practised skills.

## Project layout

```
src/
  game/                 pure game logic, no React
    cards.js            card primitives, hand values
    shoe.js             seeded RNG, shuffling, shoes with penetration
    countingSystems.js  all 8 systems (values, balance, BC/PE/IC, IRC)
    basicStrategy.js    multi-deck S17/H17 strategy tables
    deviations.js       Illustrious 18 and Fab 4 indices for Hi-Lo
    drills.js           drill generators and graders for every unit
    betting.js          bet ramp, unbalanced key counts, risk of ruin
    table.js            blackjack engine for the full-table simulator
  learning/
    units.js            the learning path: units, lessons, unlock rules
    progress.js         XP, levels, streaks, hearts, mastery decay, speed ramp
    badges.js           achievements
    readings.js         text content for the reading lessons
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
