import { useEffect, useMemo, useRef, useState } from 'react';
import { generateStrategyDrill } from '../../game/drills.js';
import { ACTION_LABELS, DEFAULT_RULES } from '../../game/basicStrategy.js';
import { cardLabel } from '../../game/cards.js';
import PlayingCard from '../../components/PlayingCard.jsx';
import Confetti from '../../components/Confetti.jsx';
import { TimerBar } from './CardValuesDrill.jsx';

const ACTION_STYLE = {
  H: 'bg-bad-500 border-bad-600 text-white',
  S: 'bg-good-500 border-good-600 text-white',
  D: 'bg-xp-500 border-xp-600 text-white',
  P: 'bg-brand-500 border-brand-700 text-white',
  R: 'bg-ink-700 border-ink-900 text-white',
};

const WHY = {
  H: 'Too weak to stand, and doubling or splitting would not pay.',
  S: 'The dealer is likely to bust or you are already strong enough.',
  D: 'You are the favourite here, so get more money on the table.',
  P: 'Two separate hands beat one awkward total against this card.',
  R: 'This hand loses more than half its bet on average; take the half back.',
};

/**
 * Unit 2 — a two-card hand against a dealer upcard. Tap the right play.
 * Config: { category, count, timed?, baseSpeedMs?, minSpeedMs? }
 */
export default function StrategyDrill({ lesson, speedMs, rules, onMistake, onFinish, onProgress }) {
  const { category, count, timed } = lesson.config;
  const effectiveRules = rules || DEFAULT_RULES;
  // Depend on the boolean, not the object: a fresh rules object on every parent render
  // must not reshuffle the hands mid-lesson.
  const h17 = !!effectiveRules.dealerHitsSoft17;
  const drill = useMemo(
    () => generateStrategyDrill({ category, count, rules: { ...DEFAULT_RULES, dealerHitsSoft17: h17 } }),
    [category, count, h17],
  );
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState('ask');
  const [picked, setPicked] = useState(null);
  const [burst, setBurst] = useState(0);
  const results = useRef([]);
  const startRef = useRef(Date.now());
  const answerRef = useRef(null);
  const item = drill.items[index];
  const total = drill.items.length;

  useEffect(() => {
    onProgress?.(index / total);
  }, [index, total, onProgress]);

  const finish = () => {
    const r = results.current;
    onFinish({ total: r.length, correct: r.filter((x) => x.correct).length, mistakes: r.filter((x) => !x.correct), durationMs: Date.now() - startRef.current });
  };

  const answer = (action) => {
    if (phase !== 'ask') return;
    const correct = action === item.correct;
    results.current.push({
      position: index + 1,
      label: item.label,
      cards: [...item.cards, item.dealer],
      expected: ACTION_LABELS[item.correct],
      entered: action ? ACTION_LABELS[action] : null,
      correct,
      note: action === null ? 'Too slow' : `Dealer showed ${cardLabel(item.dealer)}. ${WHY[item.correct]}`,
    });
    setPicked(action === null ? 'timeout' : action);
    setPhase('feedback');
    if (correct) setBurst((b) => b + 1);
    else onMistake();
    window.setTimeout(
      () => {
        if (index + 1 >= total) finish();
        else {
          setIndex(index + 1);
          setPhase('ask');
          setPicked(null);
        }
      },
      correct ? 650 : 2200,
    );
  };
  answerRef.current = answer;

  const timerOn = timed && phase === 'ask';
  useEffect(() => {
    if (!timerOn) return undefined;
    const t = setTimeout(() => answerRef.current(null), speedMs);
    return () => clearTimeout(t);
  }, [index, timerOn, speedMs]);

  const wrong = phase === 'feedback' && picked !== item.correct;

  return (
    <div className="flex flex-1 flex-col items-center">
      <div className="mt-3 w-full">{timed ? <TimerBar key={index} ms={speedMs} running={phase === 'ask'} /> : <div className="h-2" />}</div>
      <div className="mt-2 text-xs font-black uppercase tracking-wider text-ink-500">
        Hand {index + 1} of {total} · {effectiveRules.dealerHitsSoft17 ? 'H17' : 'S17'}
      </div>

      <div key={index} className="relative mt-4 w-full rounded-3xl bg-felt-700 px-4 py-5 shadow-inner">
        <div className="text-center text-[10px] font-black uppercase tracking-widest text-white/60">Dealer</div>
        <div className="mt-2 flex justify-center">
          <PlayingCard card={item.dealer} size="md" />
          <PlayingCard faceDown size="md" className="-ml-3" style={{ animationDelay: '80ms' }} />
        </div>
        <div className="mt-5 text-center text-[10px] font-black uppercase tracking-widest text-white/60">You · {item.label.split(' vs ')[0]}</div>
        <div className="relative mt-2 flex justify-center">
          {item.cards.map((c, i) => (
            <PlayingCard key={c.id} card={c} size="lg" className={`${i > 0 ? '-ml-6' : ''} ${wrong ? 'animate-shake' : ''}`} style={{ animationDelay: `${150 + i * 80}ms` }} />
          ))}
          <Confetti burst={burst} />
        </div>
      </div>

      <div className="mt-3 min-h-14 px-2 text-center font-black">
        {phase === 'feedback' &&
          (wrong ? (
            <div className="text-bad-600">
              {picked === 'timeout' ? 'Too slow! ' : ''}
              {item.label}: {ACTION_LABELS[item.correct]}.<div className="mt-0.5 text-sm font-bold text-ink-500">{WHY[item.correct]}</div>
            </div>
          ) : (
            <span className="animate-pop text-good-600">{ACTION_LABELS[item.correct]} is right!</span>
          ))}
      </div>

      <div className="mb-4 mt-auto grid w-full grid-cols-3 gap-2">
        {drill.actions.map((a) => {
          const enabled = a.id === 'P' ? item.allowed.split : a.id === 'R' ? item.allowed.surrender : true;
          let cls = 'bg-white border-ink-200 text-ink-900';
          if (phase === 'feedback') {
            if (a.id === item.correct) cls = `${ACTION_STYLE[a.id]} animate-pop`;
            else if (a.id === picked) cls = 'bg-bad-100 border-bad-500 text-bad-600 animate-shake';
            else cls = 'bg-white border-ink-100 text-ink-300';
          }
          return (
            <button
              key={a.id}
              type="button"
              disabled={!enabled || phase !== 'ask'}
              onClick={() => answer(a.id)}
              className={`btn-3d h-14 text-base ${cls} ${!enabled ? 'opacity-30' : ''} ${a.id === 'R' ? 'col-span-1' : ''}`}
            >
              {a.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
