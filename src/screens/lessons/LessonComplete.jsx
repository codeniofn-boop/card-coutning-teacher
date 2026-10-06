import { useState } from 'react';
import { useStore } from '../../state/store.jsx';
import { getLesson, getUnit } from '../../learning/units.js';
import { getBadge } from '../../learning/badges.js';
import { formatCount } from '../../game/countingSystems.js';
import { cardLabel } from '../../game/cards.js';
import Button from '../../components/Button.jsx';
import PlayingCard from '../../components/PlayingCard.jsx';
import CountChip from '../../components/CountChip.jsx';
import Confetti from '../../components/Confetti.jsx';

/** Post-lesson summary: XP, accuracy, streak, badges, and exactly where mistakes happened. */
export default function LessonComplete() {
  const { state, navigate } = useStore();
  const [showTrail, setShowTrail] = useState(false);
  const c = state.lastCompletion;
  if (!c) {
    return (
      <div className="mx-auto max-w-md p-6 text-center">
        <Button onClick={() => navigate('path')}>Back to path</Button>
      </div>
    );
  }
  const lesson = getLesson(c.lessonId);
  const unit = getUnit(lesson.unitId);
  const { result, xpGain } = c;
  const perfect = result.accuracy === 1;
  const headline = perfect ? 'Perfect!' : result.passed ? 'Lesson complete!' : 'Not quite yet';
  const emoji = perfect ? '🏆' : result.passed ? '🎉' : '💪';
  const streakLine = {
    started: `Day 1. Your streak starts now!`,
    extended: `${c.streakCount}-day streak!`,
    same: `${c.streakCount}-day streak`,
    frozen: `Streak freeze used. ${c.streakCount}-day streak saved!`,
    reset: `Streak restarted. Day 1 again.`,
  }[c.streakEvent];

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col px-5 pb-safe pt-8">
      <div className="relative flex flex-col items-center text-center">
        {result.passed && <Confetti burst={1} count={28} />}
        <div className="animate-pop text-7xl">{emoji}</div>
        <h1 className="mt-3 text-3xl font-black">{headline}</h1>
        <p className="mt-1 font-semibold text-ink-500">
          {lesson.title} · Unit {unit.number}
          {c.review ? ' · review' : ''}
        </p>
        {!result.passed && (
          <p className="mt-2 text-sm font-bold text-ink-700">
            You need {Math.round((lesson.passAccuracy ?? 0.8) * 100)}% to pass. Have another go; the drill reshuffles every time.
          </p>
        )}
      </div>

      <div className="mt-6 grid grid-cols-3 gap-2">
        <Tile label="XP" value={`+${xpGain.total}`} tone="text-xp-600" delay={0} />
        <Tile label="Accuracy" value={`${Math.round(result.accuracy * 100)}%`} tone={perfect ? 'text-good-600' : 'text-ink-900'} delay={100} />
        <Tile label="Time" value={formatTime(result.durationMs)} tone="text-brand-600" delay={200} />
      </div>

      <div className="mt-3 flex flex-wrap justify-center gap-2 text-xs font-bold text-ink-500">
        <span className="rounded-full bg-white px-2 py-1 shadow-sm">Base +{xpGain.base}</span>
        {xpGain.perfectBonus > 0 && <span className="rounded-full bg-good-100 px-2 py-1 text-good-600">Perfect +{xpGain.perfectBonus}</span>}
        {xpGain.speedBonus > 0 && <span className="rounded-full bg-brand-50 px-2 py-1 text-brand-600">Speed +{xpGain.speedBonus}</span>}
        {c.review && <span className="rounded-full bg-white px-2 py-1 shadow-sm">Review ÷2</span>}
        {result.speedMs && <span className="rounded-full bg-white px-2 py-1 shadow-sm">{(result.speedMs / 1000).toFixed(2)}s per flash</span>}
      </div>

      {result.countAccuracy != null && (
        <div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs font-black">
          <Mini label="Counts" value={pct(result.countAccuracy)} />
          <Mini label="Bets" value={pct(result.betAccuracy)} />
          <Mini label="Plays" value={pct(result.playAccuracy)} />
          <Mini label="Net" value={`${result.netUnits >= 0 ? '+' : '−'}${Math.abs(result.netUnits)}u`} />
        </div>
      )}

      <div className="mt-5 space-y-2">
        <Banner icon="🔥" text={streakLine} tone="bg-flame-500" />
        {c.levelUp && <Banner icon="⬆️" text={`Level ${c.levelUp} reached!`} tone="bg-brand-500" />}
        {c.freezeAwarded && <Banner icon="🧊" text="Streak freeze earned for a 7-day streak." tone="bg-sky-500" />}
        {c.skill && c.previousSkill && c.skill.speedMs && c.previousSkill.speedMs && c.skill.speedMs !== c.previousSkill.speedMs && (
          <Banner
            icon={c.skill.speedMs < c.previousSkill.speedMs ? '⚡' : '🐢'}
            text={`Drill speed ${c.skill.speedMs < c.previousSkill.speedMs ? 'up' : 'eased'}: ${(c.previousSkill.speedMs / 1000).toFixed(2)}s → ${(c.skill.speedMs / 1000).toFixed(2)}s`}
            tone="bg-ink-700"
          />
        )}
        {c.newBadges.map((id) => {
          const b = getBadge(id);
          return b ? <Banner key={id} icon={b.icon} text={`Badge unlocked: ${b.name}`} tone="bg-xp-500" /> : null;
        })}
      </div>

      {result.mistakes?.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2 text-sm font-black uppercase tracking-wide text-ink-500">Where you slipped ({result.mistakes.length})</h2>
          <div className="flex flex-col gap-2">
            {result.mistakes.map((m, i) => (
              <MistakeRow key={i} m={m} />
            ))}
          </div>
        </section>
      )}

      {result.trail && (
        <section className="mt-6">
          <button type="button" className="text-sm font-black uppercase tracking-wide text-brand-600" onClick={() => setShowTrail((s) => !s)}>
            {showTrail ? 'Hide the cards' : 'Replay the cards'} {showTrail ? '▴' : '▾'}
          </button>
          {showTrail && (
            <div className="mt-3 flex flex-wrap gap-2 rounded-3xl bg-white p-3 shadow-sm">
              {result.trail.map((g, i) => (
                <div key={i} className={`flex flex-col items-center rounded-xl p-1 ${g.checkpoint ? (g.checkpoint.correct ? 'bg-good-100' : 'bg-bad-100') : ''}`}>
                  <div className="flex">
                    {g.cards.map((card, j) => (
                      <PlayingCard key={`${card.id}-${j}`} card={card} size="xs" animate={false} className={j > 0 ? '-ml-4' : ''} />
                    ))}
                  </div>
                  <span className={`mt-1 text-xs font-black tabular-nums ${g.countAfter > 0 ? 'text-good-600' : g.countAfter < 0 ? 'text-bad-600' : 'text-ink-500'}`}>{formatCount(g.countAfter)}</span>
                  {g.checkpoint && !g.checkpoint.correct && <span className="text-[10px] font-bold text-bad-600">you: {formatCount(g.checkpoint.entered)}</span>}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <div className="mt-auto flex flex-col gap-2 pt-8">
        <Button full size="lg" variant="success" onClick={() => navigate(c.review ? 'review' : 'path')}>
          Continue
        </Button>
        <Button full variant="secondary" onClick={() => navigate('lesson', { lessonId: lesson.id, review: c.review, nonce: Date.now() })}>
          {result.passed ? 'Play again' : 'Try again'}
        </Button>
      </div>
    </div>
  );
}

function pct(v) {
  return v == null ? '—' : `${Math.round(v * 100)}%`;
}

function Mini({ label, value }) {
  return (
    <div className="rounded-xl bg-white px-2 py-2 shadow-sm">
      <div className="text-[10px] uppercase tracking-wide text-ink-500">{label}</div>
      <div className="text-base tabular-nums">{value}</div>
    </div>
  );
}

function Tile({ label, value, tone, delay }) {
  return (
    <div className="animate-count-up rounded-2xl bg-white p-3 text-center shadow-sm" style={{ animationDelay: `${delay}ms` }}>
      <div className="text-[10px] font-black uppercase tracking-wide text-ink-500">{label}</div>
      <div className={`text-2xl font-black tabular-nums ${tone}`}>{value}</div>
    </div>
  );
}

function Banner({ icon, text, tone }) {
  return (
    <div className={`flex items-center gap-3 rounded-2xl ${tone} px-4 py-3 font-black text-white shadow-sm animate-rise`}>
      <span className="text-2xl">{icon}</span>
      <span>{text}</span>
    </div>
  );
}

function MistakeRow({ m }) {
  const fmt = (v) => (v == null ? null : typeof v === 'number' ? formatCount(v) : String(v));
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm">
      {m.cards?.length > 0 && (
        <div className="flex shrink-0">
          {m.cards.slice(0, 5).map((card, i) => (
            <PlayingCard key={`${card.id}-${i}`} card={card} size="xs" animate={false} className={i > 0 ? '-ml-4' : ''} />
          ))}
        </div>
      )}
      <div className="min-w-0 flex-1 text-sm">
        <div className="font-black">
          {m.label || `Card ${m.position}`}
          {m.cards?.length === 1 ? ` · ${cardLabel(m.cards[0])}` : ''}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 font-bold text-ink-500">
          <span>Correct:</span>
          {typeof m.expected === 'number' ? <CountChip value={m.expected} size="sm" /> : <span className="text-good-600">{fmt(m.expected)}</span>}
          <span>You:</span>
          {m.entered == null ? (
            <span className="text-bad-600">{m.note || 'no answer'}</span>
          ) : typeof m.entered === 'number' ? (
            <span className="rounded-full bg-bad-100 px-2 py-0.5 text-sm font-black text-bad-600">{formatCount(m.entered)}</span>
          ) : (
            <span className="text-bad-600">{fmt(m.entered)}</span>
          )}
        </div>
        {m.note && m.entered != null && <div className="mt-0.5 text-xs font-semibold text-ink-500">{m.note}</div>}
      </div>
    </div>
  );
}

function formatTime(ms) {
  if (!ms) return '—';
  const s = ms / 1000;
  if (s < 60) return `${s.toFixed(1)}s`;
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.round(s % 60)).padStart(2, '0')}`;
}
