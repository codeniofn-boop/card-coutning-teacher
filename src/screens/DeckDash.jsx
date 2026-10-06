import { useState } from 'react';
import { useStore } from '../state/store.jsx';
import Button from '../components/Button.jsx';
import { skillAccuracy } from '../learning/progress.js';

const TIMES = [20, 30, 40, 50, 60, 90];
const DECKS = [1, 2, 4, 6];

/**
 * Free play: a whole deck (or several) flashes past evenly over a chosen time.
 * The learner enters the final running count. No hearts; XP and badges still count.
 */
export default function DeckDash() {
  const { navigate, track, system } = useStore();
  const [seconds, setSeconds] = useState(30);
  const [custom, setCustom] = useState('');
  const [decks, setDecks] = useState(1);
  const [removed, setRemoved] = useState(1);
  const skill = track.skills['deck-dash'];

  const total = decks * 52 - removed;
  const secs = custom !== '' ? Math.max(5, Math.min(900, Number(custom) || 0)) : seconds;
  const speedMs = Math.max(80, Math.round((secs * 1000) / total));

  const start = () =>
    navigate('lesson', {
      lessonId: 'deck-dash',
      config: { decks, removed, baseSpeedMs: speedMs, targetMs: secs * 1000, fixedSpeed: true },
      nonce: Date.now(),
    });

  return (
    <div>
      <div className="rounded-3xl bg-brand-500 p-5 text-white shadow-md">
        <div className="text-[11px] font-black uppercase tracking-wider opacity-80">Free play</div>
        <h1 className="mt-1 text-2xl font-black">Deck Dash</h1>
        <p className="mt-2 text-sm font-semibold opacity-90">
          Every card in the deck flashes by, spread evenly over the time you pick. Keep a running count in {system.name} and enter it at the end. Balanced systems land on minus the held-out cards.
        </p>
      </div>

      <section className="mt-4 rounded-3xl bg-white p-4 shadow-sm">
        <h2 className="text-sm font-black uppercase tracking-wide text-ink-500">Time for the whole deck</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {TIMES.map((t) => (
            <button key={t} type="button" onClick={() => { setSeconds(t); setCustom(''); }} className={`rounded-xl border-2 px-4 py-2 text-sm font-black ${custom === '' && seconds === t ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-ink-100 bg-white text-ink-700'}`}>
              {t}s
            </button>
          ))}
          <label className={`flex items-center gap-2 rounded-xl border-2 px-3 py-1.5 text-sm font-black ${custom !== '' ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-ink-100 bg-white text-ink-700'}`}>
            <input type="number" min="5" max="900" placeholder="Custom" value={custom} onChange={(e) => setCustom(e.target.value)} className="w-20 bg-transparent font-black outline-none" aria-label="Custom seconds" />
            s
          </label>
        </div>

        <h2 className="mt-5 text-sm font-black uppercase tracking-wide text-ink-500">Decks</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {DECKS.map((d) => (
            <button key={d} type="button" onClick={() => setDecks(d)} className={`rounded-xl border-2 px-4 py-2 text-sm font-black ${decks === d ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-ink-100 bg-white text-ink-700'}`}>
              {d}
            </button>
          ))}
        </div>

        <h2 className="mt-5 text-sm font-black uppercase tracking-wide text-ink-500">Cards held out</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {[0, 1, 2, 3].map((r) => (
            <button key={r} type="button" onClick={() => setRemoved(r)} className={`rounded-xl border-2 px-4 py-2 text-sm font-black ${removed === r ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-ink-100 bg-white text-ink-700'}`}>
              {r}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs font-semibold text-ink-500">Holding cards out keeps the answer from always being zero on balanced systems.</p>

        <div className="mt-5 rounded-2xl bg-paper p-3 text-center">
          <div className="text-[11px] font-black uppercase tracking-wider text-ink-500">This run</div>
          <div className="mt-1 text-lg font-black tabular-nums">
            {total} cards in {secs}s · {(speedMs / 1000).toFixed(2)}s per card
          </div>
        </div>
        <Button full size="lg" variant="success" className="mt-4" onClick={start}>
          Start · +20 XP
        </Button>
      </section>

      {skill?.attempts > 0 && (
        <section className="mt-4 rounded-3xl bg-white p-4 shadow-sm text-sm font-bold text-ink-700">
          <h2 className="text-sm font-black uppercase tracking-wide text-ink-500">Your record</h2>
          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1">
            <span>{skill.attempts} {skill.attempts === 1 ? 'run' : 'runs'}</span>
            <span>{Math.round(skillAccuracy(skill) * 100)}% exact</span>
            {skill.bestTimeMs && <span>Fastest perfect deck {(skill.bestTimeMs / 1000).toFixed(1)}s</span>}
          </div>
        </section>
      )}
    </div>
  );
}
