import { useEffect, useRef, useState } from 'react';
import Button from '../../components/Button.jsx';
import PlayingCard from '../../components/PlayingCard.jsx';
import ChoiceButton from './ChoiceButton.jsx';
import { readingFor } from '../../learning/readings.js';
import { riskOfRuin } from '../../game/betting.js';

/** Text pages with quick checks; content comes from learning/readings.js by lesson id. */
export default function ReadingLesson({ lesson, onFinish, onProgress }) {
  const pages = readingFor(lesson.id) || [];
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState(null);
  const results = useRef([]);
  const page = pages[index];

  useEffect(() => {
    onProgress?.(index / Math.max(1, pages.length));
  }, [index, pages.length, onProgress]);

  if (!page) return null;

  const next = () => {
    setPicked(null);
    if (index + 1 >= pages.length) {
      const r = results.current;
      onFinish({ total: r.length, correct: r.filter((x) => x.correct).length, mistakes: r.filter((x) => !x.correct) });
    } else setIndex(index + 1);
  };

  const choose = (option) => {
    if (picked) return;
    setPicked(option);
    results.current.push({ position: index + 1, label: page.question, cards: page.cards || [], expected: page.answer, entered: option, correct: option === page.answer });
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="mt-6 flex-1 animate-rise rounded-3xl bg-white p-6 shadow-sm" key={index}>
        {page.type === 'text' && (
          <>
            <div className="text-5xl">{page.icon}</div>
            <h2 className="mt-4 text-2xl font-black">{page.title}</h2>
            <p className="mt-3 text-lg font-semibold leading-relaxed text-ink-700">{page.body}</p>
          </>
        )}
        {page.type === 'ror' && <RiskOfRuinPage />}
        {page.type === 'quiz' && (
          <>
            <div className="text-[11px] font-black uppercase tracking-wider text-ink-500">Quick check</div>
            {page.cards && (
              <div className="mt-3 flex gap-2">
                {page.cards.map((card, i) => (
                  <PlayingCard key={`${card.id}-${i}`} card={card} size="md" />
                ))}
              </div>
            )}
            <h2 className="mt-3 text-2xl font-black">{page.question}</h2>
            <div className="mt-6 flex flex-col gap-3">
              {page.options.map((o) => {
                let state = 'idle';
                if (picked) {
                  if (o === page.answer) state = 'correct';
                  else if (o === picked) state = 'wrong';
                  else state = 'dim';
                }
                return (
                  <ChoiceButton key={o} state={state} onClick={() => choose(o)} disabled={!!picked}>
                    <span className="text-base normal-case">{o}</span>
                  </ChoiceButton>
                );
              })}
            </div>
            {picked && <p className={`mt-4 font-bold ${picked === page.answer ? 'text-good-600' : 'text-bad-600'}`}>{page.explain}</p>}
          </>
        )}
      </div>
      <div className="py-4">
        <Button full size="lg" variant="success" onClick={next} disabled={page.type === 'quiz' && !picked}>
          {index + 1 >= pages.length ? 'Finish' : 'Continue'}
        </Button>
      </div>
    </div>
  );
}

function RiskOfRuinPage() {
  const [bankroll, setBankroll] = useState(400);
  const ror = riskOfRuin({ bankroll });
  return (
    <>
      <div className="text-5xl">🧮</div>
      <h2 className="mt-4 text-2xl font-black">Try it</h2>
      <p className="mt-2 font-semibold text-ink-700">A typical 1-to-8 spread with a 1% edge wins about 0.025 units a round with a swing of about 4 units a round. Drag the bankroll.</p>
      <div className="mt-5 rounded-2xl bg-paper p-4">
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-black uppercase tracking-wide text-ink-500">Bankroll</span>
          <span className="text-2xl font-black tabular-nums">{bankroll} units</span>
        </div>
        <input type="range" min="100" max="1500" step="50" value={bankroll} onChange={(e) => setBankroll(Number(e.target.value))} className="mt-2 w-full accent-brand-500" aria-label="Bankroll in units" />
        <div className="mt-4 flex items-baseline justify-between">
          <span className="text-sm font-black uppercase tracking-wide text-ink-500">Risk of ruin</span>
          <span className={`text-3xl font-black tabular-nums ${ror > 0.2 ? 'text-bad-600' : ror > 0.05 ? 'text-xp-600' : 'text-good-600'}`}>{(ror * 100).toFixed(ror < 0.01 ? 2 : 0)}%</span>
        </div>
        <p className="mt-2 text-xs font-semibold text-ink-500">Approximation: e^(−2 × edge per round × bankroll ÷ variance). Real figures depend on your exact spread and rules.</p>
      </div>
    </>
  );
}
