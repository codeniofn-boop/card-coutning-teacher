import Button from '../../components/Button.jsx';
import ValueChart from '../../components/ValueChart.jsx';
import StrategyChart from '../../components/StrategyChart.jsx';
import { ILLUSTRIOUS_18, FAB_4 } from '../../game/deviations.js';
import { DEFAULT_RAMP } from '../../game/betting.js';
import { formatCount } from '../../game/countingSystems.js';

/** Pre-drill screen: what the lesson is, the goal, the values to remember and the speed slider. */
export default function LessonIntro({ lesson, unit, system, review, rules, speedMs, onSpeedChange, onStart, onQuit }) {
  const cfg = lesson.config || {};
  const timed = !!cfg.baseSpeedMs && !cfg.fixedSpeed;
  const per = lesson.type === 'table' ? 'per card' : ['strategy', 'cancellation', 'deviation', 'bet', 'trueCount', 'deckEstimation'].includes(lesson.type) ? 'per question' : cfg.mode === 'flash' && cfg.groupSize !== 1 ? 'per group' : 'per card';
  const min = cfg.minSpeedMs ?? Math.round((cfg.baseSpeedMs || 1000) / 3);
  const max = Math.round((cfg.baseSpeedMs || 1000) * 1.5);

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col px-5 pb-safe pt-4">
      <div className="flex items-center justify-between">
        <button type="button" onClick={onQuit} className="text-sm font-bold text-ink-500">
          ← Back
        </button>
        <span className="text-[11px] font-black uppercase tracking-wider text-ink-500">
          {lesson.noHearts ? 'Free play' : `Unit ${unit.number} · ${unit.title}`}
        </span>
      </div>

      <div className="mt-6 flex flex-col items-center text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-brand-50 text-4xl shadow-sm">{unit.icon}</div>
        <h1 className="mt-4 text-3xl font-black">{lesson.title}</h1>
        <p className="mt-2 font-semibold text-ink-700">{lesson.blurb}</p>
        {lesson.goal && <p className="mt-3 rounded-2xl bg-brand-50 px-3 py-2 text-sm font-bold text-brand-700">🎯 {lesson.goal}</p>}
        {review && <p className="mt-2 rounded-2xl bg-xp-400/20 px-3 py-2 text-sm font-bold text-xp-600">🔁 Review: no hearts at stake, half XP, and your hearts refill at the end.</p>}
        {cfg.fixedSpeed && (
          <p className="mt-2 rounded-2xl bg-white px-3 py-2 text-sm font-bold text-ink-700 shadow-sm">
            {cfg.decks * 52 - (cfg.removed || 0)} cards in about {Math.round(cfg.targetMs / 1000)}s · {(cfg.baseSpeedMs / 1000).toFixed(2)}s per card
          </p>
        )}
      </div>

      {(lesson.type === 'cardValues' || lesson.type === 'runningCount' || lesson.type === 'cancellation') && (
        <div className="mt-5 rounded-3xl bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-black uppercase tracking-wide text-ink-500">{system.name} values</h2>
          <ValueChart system={system} compact />
          {lesson.type === 'runningCount' && <p className="mt-3 text-xs font-semibold text-ink-500">Start every drill at 0 and add each card’s tag as it appears.</p>}
          {lesson.type === 'cancellation' && (
            <p className="mt-3 text-xs font-semibold text-ink-500">A +1 and a −1 cancel to 0. Strike those pairs out mentally and only count what is left; it halves the work on a busy table.</p>
          )}
        </div>
      )}

      {lesson.type === 'strategy' && (
        <div className="mt-5 rounded-3xl bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-black uppercase tracking-wide text-ink-500">
            {cfg.category === 'soft' ? 'Soft totals' : cfg.category === 'pairs' ? 'Pairs' : 'Hard totals'} · 4–8 decks · {rules?.dealerHitsSoft17 ? 'dealer hits soft 17' : 'dealer stands on soft 17'}
          </h2>
          <StrategyChart section={cfg.category === 'soft' ? 'soft' : cfg.category === 'pairs' ? 'pairs' : 'hard'} dealerHitsSoft17={!!rules?.dealerHitsSoft17} />
          <p className="mt-3 text-xs font-semibold text-ink-500">
            {cfg.category === 'surrender'
              ? 'Late surrender: give up half your bet on hard 15 vs 10, hard 16 vs 9, 10 or A (and a few more under H17). Everything else, play on.'
              : 'Double after split is allowed. Change the dealer rule in Profile → Settings.'}
          </p>
        </div>
      )}

      {lesson.type === 'deviation' && (
        <div className="mt-5 rounded-3xl bg-white p-4 shadow-sm">
          <h2 className="mb-2 text-sm font-black uppercase tracking-wide text-ink-500">Index numbers (Hi-Lo, true count)</h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs font-bold">
            {[...(cfg.set === 'fab4' ? FAB_4 : cfg.set === 'i18b' ? ILLUSTRIOUS_18.filter((d) => d.when === 'below') : cfg.set === 'i18a' ? ILLUSTRIOUS_18.filter((d) => d.when === 'atOrAbove' && d.id !== 'ins') : [...ILLUSTRIOUS_18, ...FAB_4])].map((d) => (
              <div key={d.id} className="flex justify-between border-b border-ink-100 py-0.5">
                <span>
                  {d.hand} v {d.upcard}
                </span>
                <span className="text-ink-500">
                  {d.action} {d.when === 'atOrAbove' ? '≥' : '<'} {formatCount(d.index)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      {(lesson.type === 'bet' || lesson.type === 'table') && (
        <div className="mt-5 rounded-3xl bg-white p-4 shadow-sm">
          <h2 className="mb-2 text-sm font-black uppercase tracking-wide text-ink-500">Bet ramp (1–8 units)</h2>
          <div className="flex flex-wrap gap-2 text-xs font-black">
            {DEFAULT_RAMP.map((r, i) => (
              <span key={i} className="rounded-xl bg-paper px-3 py-1.5">
                {i === 0 ? '≤ +1' : `${formatCount(r.tc)}${i === DEFAULT_RAMP.length - 1 ? '+' : ''}`} → {r.units}u
              </span>
            ))}
          </div>
          {!system.balanced && <p className="mt-2 text-xs font-semibold text-ink-500">{system.shortName || system.name} is unbalanced: the key count stands in for a true +1 and the pivot for +4, so you bet straight from the running count.</p>}
        </div>
      )}
      {lesson.type === 'deckEstimation' && (
        <div className="mt-5 rounded-3xl bg-white p-4 shadow-sm text-sm font-semibold text-ink-700">
          A deck is about 1.6 cm (⅝ inch) thick. Learn what one, two and three decks look like in the tray and the rest is interpolation. Answers are to the nearest half deck.
        </div>
      )}
      {lesson.type === 'trueCount' && (
        <div className="mt-5 rounded-3xl bg-white p-4 shadow-sm text-sm font-semibold text-ink-700">
          True count = running count ÷ decks remaining, rounded toward zero. +7 with 2½ decks left is 2.8 → +2. −5 with 1½ decks left is −3.3 → −3.
        </div>
      )}

      {timed && (
        <div className="mt-4 rounded-3xl bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-sm font-black">
            <span>Speed</span>
            <span className="tabular-nums text-brand-600">
              {(speedMs / 1000).toFixed(2)}s {per}
              {cfg.mode === 'deckCountdown' && <span className="text-ink-500"> · ≈{Math.round((speedMs * 51) / 1000)}s per deck</span>}
            </span>
          </div>
          <input
            type="range"
            min={min}
            max={max}
            step={50}
            value={Math.min(max, Math.max(min, speedMs))}
            onChange={(e) => onSpeedChange(Number(e.target.value))}
            className="mt-2 w-full accent-brand-500"
            aria-label="Drill speed"
          />
          <div className="flex justify-between text-[11px] font-bold text-ink-500">
            <span>Faster</span>
            <span>Slower</span>
          </div>
          <p className="mt-2 text-xs font-semibold text-ink-500">Speeds up automatically after accurate runs, and eases off after rough ones.</p>
        </div>
      )}

      <div className="mt-auto pt-6">
        <Button full size="lg" variant="success" onClick={onStart}>
          Start {review ? '' : `· +${lesson.xp} XP`}
        </Button>
      </div>
    </div>
  );
}
