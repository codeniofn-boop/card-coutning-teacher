import { useEffect, useMemo, useRef, useState } from 'react';
import { generateCardValueDrill } from '../../game/drills.js';
import { formatCount } from '../../game/countingSystems.js';
import { cardLabel } from '../../game/cards.js';
import PlayingCard from '../../components/PlayingCard.jsx';
import Confetti from '../../components/Confetti.jsx';
import ChoiceButton from './ChoiceButton.jsx';

/**
 * Unit 3 — one card at a time, tap its tag. Timed variants run a per-card
 * clock; running out counts as a miss ("too slow").
 */
export default function CardValuesDrill({ lesson, system, speedMs, onMistake, onFinish, onProgress }) {
  const { count, timed } = lesson.config;
  const drill = useMemo(() => generateCardValueDrill({ system, count }), [system, count]);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState('ask'); // ask | feedback
  const [picked, setPicked] = useState(null); // value | 'timeout'
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
    onFinish({
      total: r.length,
      correct: r.filter((x) => x.correct).length,
      mistakes: r.filter((x) => !x.correct),
      durationMs: Date.now() - startRef.current,
    });
  };

  const answer = (value) => {
    if (phase !== 'ask') return;
    const correct = value === item.correct;
    results.current.push({
      position: index + 1,
      label: `Card ${index + 1}`,
      cards: [item.card],
      expected: item.correct,
      entered: value,
      correct,
      note: value === null ? 'Too slow' : null,
    });
    setPicked(value === null ? 'timeout' : value);
    setPhase('feedback');
    if (correct) setBurst((b) => b + 1);
    else onMistake();
    window.setTimeout(() => {
      if (index + 1 >= total) finish();
      else {
        setIndex(index + 1);
        setPhase('ask');
        setPicked(null);
      }
    }, correct ? 450 : 1100);
  };
  answerRef.current = answer;

  // Per-card clock for timed lessons.
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
        Card {index + 1} of {total}
      </div>

      <div className="relative my-auto py-6">
        <PlayingCard key={index} card={item.card} size="xl" className={wrong ? 'animate-shake' : ''} />
        <Confetti burst={burst} />
      </div>

      <div className="h-10 text-center text-lg font-black">
        {phase === 'feedback' &&
          (wrong ? (
            <span className="text-bad-600">
              {picked === 'timeout' ? 'Too slow! ' : ''}
              {cardLabel(item.card)} is {formatCount(item.correct)}
            </span>
          ) : (
            <span className="animate-pop text-good-600">Yes! {formatCount(item.correct)}</span>
          ))}
      </div>

      <p className="mb-3 text-sm font-black uppercase tracking-wide text-ink-500">What is this card worth?</p>
      <div className="mb-4 grid w-full gap-3" style={{ gridTemplateColumns: `repeat(${Math.min(drill.choices.length, 3)}, minmax(0, 1fr))` }}>
        {drill.choices.map((v) => {
          let state = 'idle';
          if (phase === 'feedback') {
            if (v === item.correct) state = 'correct';
            else if (v === picked) state = 'wrong';
            else state = 'dim';
          }
          return (
            <ChoiceButton key={v} state={state} onClick={() => answer(v)} disabled={phase !== 'ask'}>
              {formatCount(v)}
            </ChoiceButton>
          );
        })}
      </div>
    </div>
  );
}

/** A bar that drains over `ms`. Remount (change key) to restart. */
export function TimerBar({ ms, running }) {
  const [full, setFull] = useState(true);
  useEffect(() => {
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setFull(false));
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, []);
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-ink-100">
      <div
        className={`h-full rounded-full ${running ? 'bg-brand-500' : 'bg-ink-200'}`}
        style={{ width: full ? '100%' : '0%', transition: full ? 'none' : `width ${ms}ms linear` }}
      />
    </div>
  );
}
