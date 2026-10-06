import { useEffect, useMemo, useRef, useState } from 'react';
import { generateCancellationDrill } from '../../game/drills.js';
import { cardValue, formatCount, roundCount } from '../../game/countingSystems.js';
import { cardLabel } from '../../game/cards.js';
import PlayingCard from '../../components/PlayingCard.jsx';
import Confetti from '../../components/Confetti.jsx';
import Button from '../../components/Button.jsx';
import ChoiceButton from './ChoiceButton.jsx';
import { TimerBar } from './CardValuesDrill.jsx';

/**
 * Unit 5 — cancellation. Modes (lesson.config.mode):
 *   pairs   two cards, tap their combined value (often 0)
 *   strike  tap cards that cancel each other, then tap the net value of the hand
 *   sprint  timed hands, tap the net value
 */
export default function CancellationDrill({ lesson, system, speedMs, onMistake, onFinish, onProgress }) {
  const { mode, count, handSize, timed } = lesson.config;
  const drill = useMemo(() => generateCancellationDrill({ system, count, handSize, cancelBias: mode === 'pairs' ? 0.45 : 0.7 }), [system, count, handSize, mode]);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState('ask'); // ask | feedback
  const [picked, setPicked] = useState(null);
  const [struck, setStruck] = useState(() => new Set());
  const [strikeError, setStrikeError] = useState(null);
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

  const struckSum = roundCount([...struck].reduce((n, i) => n + cardValue(system, item.cards[i]), 0));

  const answer = (value) => {
    if (phase !== 'ask') return;
    let correct = value === item.sum;
    let note = null;
    if (mode === 'strike' && struck.size > 0 && struckSum !== 0) {
      correct = false;
      note = `The cards you struck out add to ${formatCount(struckSum)}, not 0.`;
    }
    if (value === null) note = 'Too slow';
    if (!note && !correct) note = explain(item, system);
    results.current.push({
      position: index + 1,
      label: `Hand ${index + 1} · ${item.cards.map(cardLabel).join(' ')}`,
      cards: item.cards,
      expected: item.sum,
      entered: value,
      correct,
      note,
    });
    setPicked(value === null ? 'timeout' : value);
    setStrikeError(note && struck.size > 0 && struckSum !== 0 ? note : null);
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
          setStruck(new Set());
          setStrikeError(null);
        }
      },
      correct ? 700 : 2000,
    );
  };
  answerRef.current = answer;

  const timerOn = timed && phase === 'ask';
  useEffect(() => {
    if (!timerOn) return undefined;
    const t = setTimeout(() => answerRef.current(null), speedMs);
    return () => clearTimeout(t);
  }, [index, timerOn, speedMs]);

  const toggle = (i) => {
    if (phase !== 'ask' || mode !== 'strike') return;
    setStruck((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const wrong = phase === 'feedback' && (picked !== item.sum || strikeError);
  const size = item.cards.length <= 2 ? 'lg' : item.cards.length <= 4 ? 'md' : 'sm';
  const pairIndex = new Map();
  item.pairs.forEach(([a, b], k) => {
    pairIndex.set(a, k);
    pairIndex.set(b, k);
  });

  return (
    <div className="flex flex-1 flex-col items-center">
      <div className="mt-3 w-full">{timed ? <TimerBar key={index} ms={speedMs} running={phase === 'ask'} /> : <div className="h-2" />}</div>
      <div className="mt-2 text-xs font-black uppercase tracking-wider text-ink-500">
        Hand {index + 1} of {total}
      </div>

      <div key={index} className="relative my-auto flex flex-wrap items-center justify-center gap-2 py-6">
        {item.cards.map((c, i) => {
          const isStruck = struck.has(i);
          const revealPair = phase === 'feedback' && pairIndex.has(i);
          return (
            <button
              key={`${c.id}-${i}`}
              type="button"
              onClick={() => toggle(i)}
              className={`relative transition ${mode === 'strike' && phase === 'ask' ? 'active:scale-95' : 'cursor-default'} ${isStruck ? 'opacity-40' : ''} ${wrong && !isStruck ? 'animate-shake' : ''}`}
              style={{ animationDelay: `${i * 60}ms` }}
              aria-pressed={isStruck}
            >
              <PlayingCard card={c} size={size} />
              {isStruck && <span className="pointer-events-none absolute inset-x-1 top-1/2 h-1 -translate-y-1/2 rotate-[-20deg] rounded bg-bad-500" />}
              {revealPair && (
                <span className="pointer-events-none absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-good-500 text-[10px] font-black text-white shadow">
                  {pairIndex.get(i) + 1}
                </span>
              )}
              {phase === 'feedback' && (
                <span className={`pointer-events-none absolute inset-x-0 -bottom-5 text-center text-xs font-black ${cardValue(system, c) > 0 ? 'text-good-600' : cardValue(system, c) < 0 ? 'text-bad-600' : 'text-ink-500'}`}>
                  {formatCount(cardValue(system, c))}
                </span>
              )}
            </button>
          );
        })}
        <Confetti burst={burst} />
      </div>

      <div className="min-h-12 px-2 text-center font-black">
        {phase === 'feedback' &&
          (wrong ? (
            <div className="text-bad-600">
              {picked === 'timeout' ? 'Too slow! ' : ''}
              {strikeError || `This hand nets ${formatCount(item.sum)}.`}
              <div className="mt-0.5 text-sm font-bold text-ink-500">{explain(item, system)}</div>
            </div>
          ) : (
            <span className="animate-pop text-good-600">{item.sum === 0 ? 'Cancels to 0!' : `Nets ${formatCount(item.sum)}!`}</span>
          ))}
        {phase === 'ask' && mode === 'strike' && (
          <div className="text-sm font-bold text-ink-500">
            {struck.size === 0 ? 'Tap cards that cancel each other out, then tap the total.' : `Struck out ${struck.size} cards (${formatCount(struckSum)}).`}
            {struck.size > 0 && (
              <Button variant="ghost" size="sm" className="ml-2" onClick={() => setStruck(new Set())}>
                Clear
              </Button>
            )}
          </div>
        )}
      </div>

      <p className="mb-3 text-sm font-black uppercase tracking-wide text-ink-500">{mode === 'pairs' ? 'This pair is worth…' : 'The whole hand nets…'}</p>
      <div className="mb-4 grid w-full grid-cols-5 gap-2">
        {item.choices.map((v) => {
          let state = 'idle';
          if (phase === 'feedback') {
            if (v === item.sum) state = 'correct';
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

/** One-line explanation: which pairs cancel and what remains. */
function explain(item, system) {
  const used = new Set(item.pairs.flat());
  const pairText = item.pairs.map(([a, b]) => `${cardLabel(item.cards[a])}+${cardLabel(item.cards[b])}`).join(', ');
  const rest = item.cards.filter((_, i) => !used.has(i));
  const restText = rest.length ? rest.map((c) => `${cardLabel(c)} ${formatCount(cardValue(system, c))}`).join(', ') : 'nothing';
  return `${item.pairs.length ? `Cancel ${pairText}. ` : 'Nothing cancels. '}Left over: ${restText}.`;
}
