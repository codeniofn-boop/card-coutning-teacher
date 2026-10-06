import { useEffect, useMemo, useRef, useState } from 'react';
import Confetti from '../../components/Confetti.jsx';
import ChoiceButton from './ChoiceButton.jsx';
import { TimerBar } from './CardValuesDrill.jsx';

/**
 * Generic multiple-choice drill shell used by Units 6–9. The caller provides:
 *   items        [{ ...anything }]
 *   correctOf    (item) => value
 *   choicesOf    (item) => [values]
 *   labelOf      (value) => string          button text
 *   render       (item, phase) => JSX        the prompt area
 *   mistakeOf    (item, entered) => partial mistake record { label, cards?, note? }
 *   feedback     (item, correct) => string
 *   columns      grid columns for the choices
 */
export default function QuizDrill({ items, correctOf, choicesOf, labelOf, render, mistakeOf, feedback, columns = 5, timed = false, speedMs, onMistake, onFinish, onProgress, prompt }) {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState('ask');
  const [picked, setPicked] = useState(null);
  const [burst, setBurst] = useState(0);
  const results = useRef([]);
  const startRef = useRef(Date.now());
  const answerRef = useRef(null);
  const item = items[index];
  const total = items.length;
  const correct = useMemo(() => correctOf(item), [item, correctOf]);
  const choices = useMemo(() => choicesOf(item), [item, choicesOf]);

  useEffect(() => {
    onProgress?.(index / total);
  }, [index, total, onProgress]);

  const answer = (value) => {
    if (phase !== 'ask') return;
    const ok = value === correct;
    results.current.push({ position: index + 1, expected: labelOf(correct), entered: value === null ? null : labelOf(value), correct: ok, ...mistakeOf(item, value), note: value === null ? 'Too slow' : mistakeOf(item, value).note });
    setPicked(value === null ? 'timeout' : value);
    setPhase('feedback');
    if (ok) setBurst((b) => b + 1);
    else onMistake();
    window.setTimeout(
      () => {
        if (index + 1 >= total) {
          const r = results.current;
          onFinish({ total: r.length, correct: r.filter((x) => x.correct).length, mistakes: r.filter((x) => !x.correct), durationMs: Date.now() - startRef.current });
        } else {
          setIndex(index + 1);
          setPhase('ask');
          setPicked(null);
        }
      },
      ok ? 700 : 2200,
    );
  };
  answerRef.current = answer;

  const timerOn = timed && phase === 'ask';
  useEffect(() => {
    if (!timerOn) return undefined;
    const t = setTimeout(() => answerRef.current(null), speedMs);
    return () => clearTimeout(t);
  }, [index, timerOn, speedMs]);

  const wrong = phase === 'feedback' && picked !== correct;

  return (
    <div className="flex flex-1 flex-col items-center">
      <div className="mt-3 w-full">{timed ? <TimerBar key={index} ms={speedMs} running={phase === 'ask'} /> : <div className="h-2" />}</div>
      <div className="mt-2 text-xs font-black uppercase tracking-wider text-ink-500">
        {index + 1} of {total}
      </div>
      <div key={index} className={`relative my-auto w-full py-4 ${wrong ? 'animate-shake' : ''}`}>
        {render(item, phase)}
        <Confetti burst={burst} />
      </div>
      <div className="min-h-12 px-2 text-center font-black">
        {phase === 'feedback' &&
          (wrong ? (
            <div className="text-bad-600">
              {picked === 'timeout' ? 'Too slow! ' : ''}
              {feedback(item, false)}
            </div>
          ) : (
            <span className="animate-pop text-good-600">{feedback(item, true)}</span>
          ))}
      </div>
      {prompt && <p className="mb-3 text-sm font-black uppercase tracking-wide text-ink-500">{prompt}</p>}
      <div className="mb-4 grid w-full gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(columns, choices.length)}, minmax(0, 1fr))` }}>
        {choices.map((v) => {
          let state = 'idle';
          if (phase === 'feedback') {
            if (v === correct) state = 'correct';
            else if (v === picked) state = 'wrong';
            else state = 'dim';
          }
          return (
            <ChoiceButton key={String(v)} state={state} onClick={() => answer(v)} disabled={phase !== 'ask'}>
              <span className={String(labelOf(v)).length > 6 ? 'text-sm normal-case' : ''}>{labelOf(v)}</span>
            </ChoiceButton>
          );
        })}
      </div>
    </div>
  );
}
