import { useMemo } from 'react';
import QuizDrill from './QuizDrill.jsx';
import DiscardTray from '../../components/DiscardTray.jsx';
import PlayingCard from '../../components/PlayingCard.jsx';
import CountChip from '../../components/CountChip.jsx';
import { generateDeckEstimationDrill, generateTrueCountDrill, generateBetDrill, generateDeviationDrill } from '../../game/drills.js';
import { formatCount } from '../../game/countingSystems.js';
import { cardLabel } from '../../game/cards.js';
import { keyCount } from '../../game/betting.js';

const fmtDecks = (d) => (Number.isInteger(d) ? `${d}` : `${d}`.replace('.5', '½'));

/** Unit 6 — read the discard tray. */
export function DeckEstimationDrill({ lesson, speedMs, onMistake, onFinish, onProgress }) {
  const cfg = lesson.config;
  const drill = useMemo(() => generateDeckEstimationDrill({ count: cfg.count, shoeDecks: cfg.shoeDecks, mode: cfg.mode, precision: cfg.precision }), [cfg]);
  return (
    <QuizDrill
      items={drill.items}
      correctOf={(it) => it.answer}
      choicesOf={(it) => it.choices}
      labelOf={(v) => fmtDecks(v)}
      timed={!!cfg.timed}
      speedMs={speedMs}
      onMistake={onMistake}
      onFinish={onFinish}
      onProgress={onProgress}
      prompt={cfg.mode === 'played' ? 'Decks in the tray?' : 'Decks left in the shoe?'}
      render={(it) => (
        <div className="flex flex-col items-center">
          <div className="mb-3 text-sm font-bold text-ink-500">{it.shoeDecks}-deck shoe{cfg.mode === 'remaining' ? ' · how many decks are still to come?' : ''}</div>
          <DiscardTray cards={it.cardsInTray} maxCards={Math.max(it.shoeDecks, 2) * 52} referenceDecks={cfg.reference ? it.shoeDecks : 0} />
        </div>
      )}
      mistakeOf={(it) => ({ label: `${it.cardsInTray} cards in the tray (${it.shoeDecks} decks)`, note: `Exactly ${it.exact.toFixed(2)} decks ${cfg.mode === 'played' ? 'played' : 'remaining'}.` })}
      feedback={(it, ok) => (ok ? `Yes, about ${fmtDecks(it.answer)} decks.` : `${it.cardsInTray} cards is ${it.exact.toFixed(1)} decks ${cfg.mode === 'played' ? 'played' : 'left'}: call it ${fmtDecks(it.answer)}.`)}
    />
  );
}

/** Unit 7 — running count ÷ decks remaining. */
export function TrueCountDrill({ lesson, speedMs, onMistake, onFinish, onProgress }) {
  const cfg = lesson.config;
  const drill = useMemo(() => generateTrueCountDrill({ count: cfg.count }), [cfg]);
  return (
    <QuizDrill
      items={drill.items}
      correctOf={(it) => it.tc}
      choicesOf={(it) => it.choices}
      labelOf={(v) => formatCount(v)}
      timed={!!cfg.timed}
      speedMs={speedMs}
      onMistake={onMistake}
      onFinish={onFinish}
      onProgress={onProgress}
      prompt="True count (toward zero)?"
      render={(it) => (
        <div className="flex items-center justify-center gap-4">
          <Stat label="Running count"><CountChip value={it.rc} size="lg" /></Stat>
          <span className="text-3xl font-black text-ink-300">÷</span>
          <Stat label="Decks left"><span className="text-3xl font-black">{fmtDecks(it.decksLeft)}</span></Stat>
        </div>
      )}
      mistakeOf={(it) => ({ label: `${formatCount(it.rc)} with ${fmtDecks(it.decksLeft)} decks left`, note: `${it.rc} ÷ ${it.decksLeft} = ${(it.rc / it.decksLeft).toFixed(2)} → ${formatCount(it.tc)}` })}
      feedback={(it, ok) => (ok ? `${formatCount(it.rc)} ÷ ${fmtDecks(it.decksLeft)} → ${formatCount(it.tc)}` : `${it.rc} ÷ ${it.decksLeft} = ${(it.rc / it.decksLeft).toFixed(2)}, so ${formatCount(it.tc)}.`)}
    />
  );
}

/** Unit 8 — pick the bet from the ramp. */
export function BetDrill({ lesson, system, speedMs, onMistake, onFinish, onProgress }) {
  const cfg = lesson.config;
  const drill = useMemo(() => generateBetDrill({ system, count: cfg.count, decks: cfg.decks || 6 }), [system, cfg]);
  const key = system.balanced ? null : keyCount(system, cfg.decks || 6);
  return (
    <QuizDrill
      items={drill.items}
      correctOf={(it) => it.correct}
      choicesOf={(it) => it.choices}
      labelOf={(v) => `${v}u`}
      timed={!!cfg.timed}
      speedMs={speedMs}
      onMistake={onMistake}
      onFinish={onFinish}
      onProgress={onProgress}
      prompt="How many units do you bet?"
      render={(it) => (
        <div className="flex flex-col items-center gap-2">
          {system.balanced ? (
            <Stat label="True count"><CountChip value={it.trueCount} size="lg" /></Stat>
          ) : (
            <>
              <Stat label="Running count"><CountChip value={it.runningCount} size="lg" /></Stat>
              <div className="text-xs font-bold text-ink-500">
                {system.shortName || system.name}, {it.decks} decks · key count {formatCount(key)} · pivot {formatCount(system.pivot ?? 0)}
              </div>
            </>
          )}
        </div>
      )}
      mistakeOf={(it) => ({ label: system.balanced ? `True count ${formatCount(it.trueCount)}` : `Running count ${formatCount(it.runningCount)}`, note: 'Ramp: ≤+1 → 1u, +2 → 2u, +3 → 4u, +4 → 6u, +5 and up → 8u.' })}
      feedback={(it, ok) => (ok ? `${it.correct} unit${it.correct === 1 ? '' : 's'}, by the ramp.` : `The ramp says ${it.correct} unit${it.correct === 1 ? '' : 's'} here.`)}
    />
  );
}

/** Unit 9 — index plays. */
export function DeviationDrill({ lesson, speedMs, onMistake, onFinish, onProgress }) {
  const cfg = lesson.config;
  const drill = useMemo(() => generateDeviationDrill({ set: cfg.set, count: cfg.count }), [cfg]);
  return (
    <QuizDrill
      items={drill.items}
      correctOf={(it) => it.correct}
      choicesOf={(it) => it.options}
      labelOf={(v) => v}
      columns={2}
      timed={!!cfg.timed}
      speedMs={speedMs}
      onMistake={onMistake}
      onFinish={onFinish}
      onProgress={onProgress}
      prompt="What's the play?"
      render={(it) => (
        <div className="rounded-3xl bg-felt-700 px-4 py-4 text-white">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-white/60">Dealer</div>
              <div className="mt-1 flex">
                <PlayingCard card={it.dealer} size="md" />
                <PlayingCard faceDown size="md" className="-ml-3" />
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-black uppercase tracking-widest text-white/60">True count</div>
              <div className="mt-1 text-4xl font-black tabular-nums">{formatCount(it.trueCount)}</div>
            </div>
          </div>
          <div className="mt-4 text-[10px] font-black uppercase tracking-widest text-white/60">You · {it.deviation.hand === 'Insurance' ? 'any hand' : it.deviation.hand === '10,10' ? 'pair of tens' : `hard ${it.deviation.hand}`}</div>
          <div className="mt-1 flex">
            {it.cards.map((c, i) => (
              <PlayingCard key={`${c.id}-${i}`} card={c} size="md" className={i > 0 ? '-ml-4' : ''} />
            ))}
          </div>
        </div>
      )}
      mistakeOf={(it) => ({
        label: `${it.deviation.hand} vs ${it.deviation.upcard} at ${formatCount(it.trueCount)}`,
        cards: [...it.cards, it.dealer],
        note: `Index ${formatCount(it.deviation.index)}: ${it.deviation.action} ${it.deviation.when === 'atOrAbove' ? 'at or above' : 'below'} it, otherwise ${it.deviation.fallback}.`,
      })}
      feedback={(it, ok) =>
        ok
          ? `${it.correct}. Index is ${formatCount(it.deviation.index)}.`
          : `${it.correct}: the index is ${formatCount(it.deviation.index)} (${it.deviation.when === 'atOrAbove' ? `${it.deviation.action} at or above` : `${it.deviation.action} below`}).`
      }
    />
  );
}

function Stat({ label, children }) {
  return (
    <div className="flex flex-col items-center rounded-2xl bg-white px-5 py-3 shadow-sm">
      <div className="text-[10px] font-black uppercase tracking-wider text-ink-500">{label}</div>
      <div className="mt-1">{children}</div>
    </div>
  );
}

export { cardLabel };
