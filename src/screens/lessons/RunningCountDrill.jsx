import { useEffect, useMemo, useRef, useState } from 'react';
import { generateCountAlongDrill, generateDeckCountdown, generateFlashDrill } from '../../game/drills.js';
import { formatCount, hasHalfValues } from '../../game/countingSystems.js';
import { cardLabel } from '../../game/cards.js';
import PlayingCard from '../../components/PlayingCard.jsx';
import Confetti from '../../components/Confetti.jsx';
import CountChip from '../../components/CountChip.jsx';
import Keypad from '../../components/Keypad.jsx';
import Button from '../../components/Button.jsx';
import ChoiceButton from './ChoiceButton.jsx';

/**
 * Unit 4 — running count drills. Three modes, chosen by lesson.config.mode:
 *   countAlong     one card at a time, pick the new count from three choices
 *   flash          groups of cards flash automatically; enter the count at checkpoints
 *   deckCountdown  a whole deck (minus a few cards) against the clock
 */
export default function RunningCountDrill(props) {
  const mode = props.lesson.config.mode;
  if (mode === 'countAlong') return <CountAlong {...props} />;
  if (mode === 'deckCountdown') return <DeckCountdown {...props} />;
  return <FlashCount {...props} />;
}

// ---------------------------------------------------------------- count along

function CountAlong({ lesson, system, onMistake, onFinish, onProgress }) {
  const count = lesson.config.count;
  const drill = useMemo(() => generateCountAlongDrill({ system, count }), [system, count]);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState('ask');
  const [picked, setPicked] = useState(null);
  const [burst, setBurst] = useState(0);
  const results = useRef([]);
  const startRef = useRef(Date.now());
  const item = drill.items[index];
  const total = drill.items.length;
  const before = index === 0 ? 0 : drill.items[index - 1].countAfter;

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
      trail: drill.items.map((it, i) => ({
        cards: [it.card],
        countAfter: it.countAfter,
        checkpoint: r[i] ? { entered: r[i].entered, expected: r[i].expected, correct: r[i].correct } : null,
      })),
    });
  };

  const answer = (value) => {
    if (phase !== 'ask') return;
    const correct = value === item.countAfter;
    results.current.push({ position: index + 1, label: `Card ${index + 1}`, cards: [item.card], expected: item.countAfter, entered: value, correct });
    setPicked(value);
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
    }, correct ? 650 : 1500);
  };

  const wrong = phase === 'feedback' && picked !== item.countAfter;

  return (
    <div className="flex flex-1 flex-col items-center">
      <div className="mt-4 flex items-center gap-2 text-sm font-bold text-ink-500">
        Count before this card <CountChip value={before} size="sm" />
      </div>
      <div className="relative my-auto py-6">
        <PlayingCard key={index} card={item.card} size="xl" className={wrong ? 'animate-shake' : ''} />
        <Confetti burst={burst} />
      </div>
      <div className="h-12 px-2 text-center font-black">
        {phase === 'feedback' &&
          (wrong ? (
            <span className="text-bad-600">
              {cardLabel(item.card)} is {formatCount(item.value)}, so the count is {formatCount(item.countAfter)}
            </span>
          ) : (
            <span className="animate-pop text-good-600">
              {cardLabel(item.card)} is {formatCount(item.value)} → {formatCount(item.countAfter)}
            </span>
          ))}
      </div>
      <p className="mb-3 text-sm font-black uppercase tracking-wide text-ink-500">What’s the running count now?</p>
      <div className="mb-4 grid w-full grid-cols-3 gap-3">
        {item.choices.map((v) => {
          let state = 'idle';
          if (phase === 'feedback') {
            if (v === item.countAfter) state = 'correct';
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

// ---------------------------------------------------------------- flash groups

function FlashCount({ lesson, system, speedMs, onMistake, onFinish, onProgress }) {
  const cfg = lesson.config;
  const drill = useMemo(
    () => generateFlashDrill({ system, groups: cfg.groups, groupSize: cfg.groupSize, checkpointEvery: cfg.checkpointEvery }),
    [system, cfg],
  );
  const [phase, setPhase] = useState('ready'); // ready | flash | checkpoint | reveal
  const [countdown, setCountdown] = useState(3);
  const [groupIndex, setGroupIndex] = useState(0);
  const [input, setInput] = useState('');
  const [reveal, setReveal] = useState(null);
  const [burst, setBurst] = useState(0);
  const checkpoints = useRef([]);
  const startRef = useRef(0);
  const total = drill.groups.length;
  const allowHalf = hasHalfValues(system);

  useEffect(() => {
    onProgress?.(groupIndex / total);
  }, [groupIndex, total, onProgress]);

  // 3-2-1
  useEffect(() => {
    if (phase !== 'ready') return undefined;
    if (countdown === 0) {
      startRef.current = Date.now();
      setPhase('flash');
      return undefined;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 650);
    return () => clearTimeout(t);
  }, [phase, countdown]);

  // Auto-advance through groups; pause at checkpoints. Distraction mode adds
  // timing jitter and random table chatter.
  const [chatter, setChatter] = useState(null);
  useEffect(() => {
    if (phase !== 'flash') return undefined;
    const jitter = cfg.distract ? 0.55 + Math.random() * 0.9 : 1;
    if (cfg.distract) setChatter(Math.random() < 0.45 ? CHATTER[Math.floor(Math.random() * CHATTER.length)] : null);
    const t = setTimeout(() => {
      if (drill.checkpoints.includes(groupIndex)) setPhase('checkpoint');
      else setGroupIndex((g) => g + 1);
    }, Math.round(speedMs * jitter));
    return () => clearTimeout(t);
  }, [phase, groupIndex, speedMs, drill, cfg.distract]);

  const finish = () => {
    const r = checkpoints.current;
    onFinish({
      total: r.length,
      correct: r.filter((x) => x.correct).length,
      mistakes: r.filter((x) => !x.correct),
      durationMs: Date.now() - startRef.current,
      trail: drill.groups.map((cards, i) => {
        const cp = r.find((x) => x.groupIndex === i);
        return { cards, countAfter: drill.trail[i], checkpoint: cp ? { entered: cp.entered, expected: cp.expected, correct: cp.correct } : null };
      }),
    });
  };

  const submit = (value) => {
    const expected = drill.trail[groupIndex];
    const correct = value === expected;
    const cardsShown = drill.groups.slice(0, groupIndex + 1).reduce((n, g) => n + g.length, 0);
    checkpoints.current.push({
      groupIndex,
      position: cardsShown,
      label: `After card ${cardsShown}`,
      cards: drill.groups[groupIndex],
      expected,
      entered: value,
      correct,
    });
    setInput('');
    setReveal({ correct, expected, entered: value });
    setPhase('reveal');
    if (correct) setBurst((b) => b + 1);
    else onMistake();
  };

  const proceed = () => {
    setReveal(null);
    if (groupIndex + 1 >= total) finish();
    else {
      setGroupIndex(groupIndex + 1);
      setPhase('flash');
    }
  };

  // Correct checkpoints continue on their own; wrong ones wait for a tap.
  useEffect(() => {
    if (phase !== 'reveal' || !reveal?.correct) return undefined;
    const t = setTimeout(proceed, 900);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, reveal]);

  if (phase === 'ready') return <Countdown value={countdown} note={`${total} ${describeGroup(cfg.groupSize)} will flash every ${(speedMs / 1000).toFixed(1)}s. Count starts at 0.`} />;

  if (phase === 'checkpoint') {
    return (
      <div className="flex flex-1 flex-col items-center">
        <div className="mt-6 text-xs font-black uppercase tracking-wider text-ink-500">Checkpoint</div>
        <h2 className="mt-1 text-2xl font-black">What’s the running count?</h2>
        <div className="mt-6 w-full">
          <Keypad value={input} onChange={setInput} onSubmit={submit} allowHalf={allowHalf} />
        </div>
      </div>
    );
  }

  if (phase === 'reveal') {
    return (
      <div className="relative flex flex-1 flex-col items-center justify-center text-center">
        {reveal.correct && <Confetti burst={burst} />}
        {reveal.correct ? (
          <>
            <div className="animate-pop text-6xl">✅</div>
            <div className="mt-3 text-2xl font-black text-good-600">Spot on, {formatCount(reveal.expected)}</div>
          </>
        ) : (
          <>
            <div className="text-6xl">❌</div>
            <div className="mt-3 text-xl font-black text-bad-600">
              You entered {formatCount(reveal.entered)}. The count is {formatCount(reveal.expected)}.
            </div>
            <p className="mt-2 font-semibold text-ink-500">Pick up from {formatCount(reveal.expected)} and keep going.</p>
            <Button className="mt-6" size="lg" onClick={proceed}>
              Continue from {formatCount(reveal.expected)}
            </Button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center">
      <div className="mt-3 text-xs font-black uppercase tracking-wider text-ink-500">
        {groupIndex + 1} of {total}
      </div>
      <div className="relative my-auto py-6">
        <CardGroup key={groupIndex} cards={drill.groups[groupIndex]} />
        {chatter && (
          <div key={chatter + groupIndex} className="pointer-events-none absolute -top-2 left-1/2 w-56 -translate-x-1/2 animate-rise rounded-2xl bg-ink-900 px-3 py-2 text-center text-sm font-bold text-white shadow-lg">
            {chatter}
          </div>
        )}
      </div>
      <p className="mb-6 text-sm font-bold text-ink-300">{cfg.distract ? 'Ignore the noise. Keep the count.' : 'Keep the count in your head.'}</p>
    </div>
  );
}

const CHATTER = [
  'Dealer: “Good luck, everyone!”',
  'Player: “Hit me… no, stand!”',
  '“Cocktails?”',
  'Dealer: “Insurance, anyone?”',
  'Player: “That was MY ten!”',
  'A pit boss wanders over.',
  'Your phone buzzes.',
  'Dealer: “Nice hand, sir.”',
  'Someone drops a chip.',
  'Dealer: “Checks play!”',
];

// ---------------------------------------------------------------- deck countdown

function DeckCountdown({ lesson, system, speedMs, onMistake, onFinish, onProgress }) {
  const drill = useMemo(() => generateDeckCountdown({ system, removed: 1 + Math.floor(Math.random() * 3) }), [system]);
  const [phase, setPhase] = useState('ready'); // ready | flash | answer
  const [countdown, setCountdown] = useState(3);
  const [cardIndex, setCardIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [input, setInput] = useState('');
  const startRef = useRef(0);
  const flashMs = useRef(0);
  const total = drill.cards.length;
  const allowHalf = hasHalfValues(system);

  useEffect(() => {
    onProgress?.(phase === 'answer' ? 1 : cardIndex / total);
  }, [cardIndex, total, phase, onProgress]);

  useEffect(() => {
    if (phase !== 'ready') return undefined;
    if (countdown === 0) {
      startRef.current = Date.now();
      setPhase('flash');
      return undefined;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 650);
    return () => clearTimeout(t);
  }, [phase, countdown]);

  useEffect(() => {
    if (phase !== 'flash') return undefined;
    const t = setTimeout(() => {
      if (cardIndex + 1 >= total) {
        flashMs.current = Date.now() - startRef.current;
        setPhase('answer');
      } else setCardIndex((i) => i + 1);
    }, speedMs);
    return () => clearTimeout(t);
  }, [phase, cardIndex, total, speedMs]);

  useEffect(() => {
    if (phase !== 'flash') return undefined;
    const iv = setInterval(() => setElapsed(Date.now() - startRef.current), 100);
    return () => clearInterval(iv);
  }, [phase]);

  const submit = (value) => {
    const correct = value === drill.finalCount;
    if (!correct) onMistake();
    const missing = drill.removedCards.map(cardLabel).join(' ');
    onFinish({
      total: 1,
      correct: correct ? 1 : 0,
      mistakes: correct
        ? []
        : [{ position: total, label: 'Final count', cards: drill.removedCards, expected: drill.finalCount, entered: value, note: `Cards held out of the deck: ${missing}` }],
      durationMs: flashMs.current,
      removedCards: drill.removedCards,
      trail: drill.cards.map((c, i) => ({ cards: [c], countAfter: drill.trail[i], checkpoint: null })),
    });
  };

  if (phase === 'ready') {
    return <Countdown value={countdown} note={`${total} cards, ${drill.removedCards.length} held out. ${(speedMs / 1000).toFixed(2)}s per card. Count starts at 0.`} />;
  }

  if (phase === 'answer') {
    return (
      <div className="flex flex-1 flex-col items-center">
        <div className="mt-6 text-xs font-black uppercase tracking-wider text-ink-500">Deck done in {(flashMs.current / 1000).toFixed(1)}s</div>
        <h2 className="mt-1 text-2xl font-black">What’s the final count?</h2>
        <div className="mt-6 w-full">
          <Keypad value={input} onChange={setInput} onSubmit={submit} allowHalf={allowHalf} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center">
      <div className="mt-3 flex w-full items-center justify-between text-xs font-black uppercase tracking-wider text-ink-500">
        <span>
          Card {cardIndex + 1} / {total}
        </span>
        <span className="tabular-nums text-brand-600">{(elapsed / 1000).toFixed(1)}s</span>
      </div>
      <div className="my-auto py-6">
        <PlayingCard key={cardIndex} card={drill.cards[cardIndex]} size="xl" />
      </div>
      <p className="mb-6 text-sm font-bold text-ink-300">Keep the count in your head.</p>
    </div>
  );
}

// ---------------------------------------------------------------- shared bits

function Countdown({ value, note }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center">
      <div key={value} className="animate-pop text-8xl font-black text-brand-600">
        {value === 0 ? 'Go!' : value}
      </div>
      <p className="mt-6 max-w-xs font-semibold text-ink-500">{note}</p>
    </div>
  );
}

/** One flash group. Singles are huge, pairs large, hands overlap like a real hand. */
function CardGroup({ cards }) {
  const size = cards.length === 1 ? 'xl' : cards.length === 2 ? 'lg' : 'md';
  const overlap = cards.length >= 3;
  return (
    <div className="flex items-center justify-center">
      {cards.map((c, i) => (
        <PlayingCard key={`${c.id}-${i}`} card={c} size={size} className={`${overlap && i > 0 ? '-ml-5' : i > 0 ? 'ml-3' : ''}`} style={{ animationDelay: `${i * 70}ms` }} />
      ))}
    </div>
  );
}

function describeGroup(groupSize) {
  if (groupSize === 1) return 'cards';
  if (groupSize === 2) return 'pairs';
  return 'hands';
}
