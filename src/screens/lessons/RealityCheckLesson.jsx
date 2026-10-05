import { useEffect, useRef, useState } from 'react';
import Button from '../../components/Button.jsx';
import ChoiceButton from './ChoiceButton.jsx';

/** Short, honest framing of what card counting is and isn't. Text pages with a few checks. */
const PAGES = [
  {
    type: 'text',
    icon: '⚖️',
    title: 'Legal, but not welcome',
    body: 'Counting cards in your head is legal in the US and most of the world. Casinos are private businesses though: if they think you are counting they can ask you to stop playing blackjack, or to leave. That is a “back-off”, and it happens to every serious counter eventually.',
  },
  {
    type: 'text',
    icon: '📏',
    title: 'The edge is small',
    body: 'A solid counter with a good bet spread has roughly a 0.5–1.5% edge over the house. On $1,000 of total bets that is about $5–15 of expected profit. The edge only shows up as an average over a very large number of hands.',
  },
  {
    type: 'quiz',
    question: 'Card counting in your head is illegal in the United States.',
    options: ['True', 'False'],
    answer: 'False',
    explain: 'It is legal. Casinos can still refuse to let you play.',
  },
  {
    type: 'text',
    icon: '🎢',
    title: 'Variance is enormous',
    body: 'Even with an edge, losing streaks that last many hours are normal. Counters think in hundreds of hours of play, not sessions. A bad weekend proves nothing, and neither does a good one.',
  },
  {
    type: 'text',
    icon: '🏦',
    title: 'You need a bankroll',
    body: 'Bets scale with the count, so a 1-to-8 spread at a $25 table means $200 top bets. To keep the risk of going broke low, pros keep a bankroll of several hundred top bets. That is real money set aside for nothing else.',
  },
  {
    type: 'quiz',
    question: 'With a 1% edge, roughly how much does a counter expect to win per $1,000 wagered?',
    options: ['$10', '$100', '$500'],
    answer: '$10',
    explain: '1% of $1,000 is $10, and that is an average, not a guarantee.',
  },
  {
    type: 'quiz',
    question: 'If you count perfectly, you will win every session.',
    options: ['True', 'False'],
    answer: 'False',
    explain: 'A small edge with high variance means plenty of losing sessions.',
  },
  {
    type: 'text',
    icon: '🎯',
    title: 'So why learn it?',
    body: 'Because it is a genuinely hard, satisfying skill, and the only honest way to play blackjack with an edge. Treat it as a demanding hobby with a possible upside, not a paycheck. That mindset is what keeps it fun.',
  },
];

export default function RealityCheckLesson({ onFinish, onProgress }) {
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState(null);
  const results = useRef([]);
  const page = PAGES[index];

  useEffect(() => {
    onProgress?.(index / PAGES.length);
  }, [index, onProgress]);

  const next = () => {
    setPicked(null);
    if (index + 1 >= PAGES.length) {
      const r = results.current;
      onFinish({ total: r.length, correct: r.filter((x) => x.correct).length, mistakes: r.filter((x) => !x.correct) });
    } else setIndex(index + 1);
  };

  const choose = (option) => {
    if (picked) return;
    setPicked(option);
    results.current.push({ position: index + 1, label: page.question, expected: page.answer, entered: option, correct: option === page.answer });
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="mt-6 flex-1 rounded-3xl bg-white p-6 shadow-sm animate-rise" key={index}>
        {page.type === 'text' ? (
          <>
            <div className="text-5xl">{page.icon}</div>
            <h2 className="mt-4 text-2xl font-black">{page.title}</h2>
            <p className="mt-3 text-lg font-semibold leading-relaxed text-ink-700">{page.body}</p>
          </>
        ) : (
          <>
            <div className="text-[11px] font-black uppercase tracking-wider text-ink-500">Quick check</div>
            <h2 className="mt-2 text-2xl font-black">{page.question}</h2>
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
                    {o}
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
          {index + 1 >= PAGES.length ? 'Finish' : 'Continue'}
        </Button>
      </div>
    </div>
  );
}
