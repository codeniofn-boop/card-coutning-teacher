import { useState } from 'react';
import { useStore } from '../state/store.jsx';
import { SYSTEMS, getSystem } from '../game/countingSystems.js';
import { makeCard } from '../game/cards.js';
import Button from '../components/Button.jsx';
import PlayingCard from '../components/PlayingCard.jsx';
import ValueChart from '../components/ValueChart.jsx';
import LevelPill from '../components/LevelPill.jsx';

const FAN = [makeCard('5', 'H'), makeCard('A', 'S'), makeCard('K', 'D')];

/** Three steps: welcome → pick a system → quick primer. */
export default function Onboarding() {
  const { state, dispatch, navigate } = useStore();
  const [step, setStep] = useState(state.screen.step || 'welcome');
  const [choice, setChoice] = useState(state.screen.choice || 'hilo');

  if (step === 'welcome') {
    return (
      <div className="mx-auto flex min-h-full max-w-md flex-col items-center justify-center px-6 py-10 text-center">
        <div className="relative mb-8 h-48 w-full">
          {FAN.map((card, i) => (
            <div
              key={card.id}
              className="absolute bottom-0 left-1/2 -ml-14"
              style={{ transform: `rotate(${(i - 1) * 14}deg) translateX(${(i - 1) * 40}px)`, transformOrigin: '50% 140%', zIndex: i }}
            >
              <PlayingCard card={card} size="lg" animate={false} className="animate-float" style={{ animationDelay: `${i * 250}ms` }} />
            </div>
          ))}
        </div>
        <h1 className="text-5xl font-black tracking-tight text-brand-600">CountUp</h1>
        <p className="mt-3 text-lg font-bold text-ink-700">Learn to count cards the way you’d learn a language.</p>
        <ul className="mt-6 space-y-2 text-left text-ink-700">
          <li className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm">
            <span className="text-2xl">⚡</span>
            <span className="font-bold">Two to five minute lessons, lots of reps</span>
          </li>
          <li className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm">
            <span className="text-2xl">🧮</span>
            <span className="font-bold">Eight counting systems, each with its own track</span>
          </li>
          <li className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm">
            <span className="text-2xl">🎰</span>
            <span className="font-bold">Build up to a full simulated shoe with bets and plays</span>
          </li>
        </ul>
        <Button full size="lg" className="mt-8" onClick={() => setStep('pick')}>
          Get started
        </Button>
        <p className="mt-4 text-xs font-semibold text-ink-500">Counting is legal, but no guarantees of profit. We’ll be honest about that.</p>
      </div>
    );
  }

  if (step === 'pick') {
    return (
      <div className="mx-auto flex min-h-full max-w-md flex-col px-5 py-8">
        <h2 className="text-3xl font-black">Pick a counting system</h2>
        <p className="mt-2 font-semibold text-ink-500">Hi-Lo is the best place to start. You can switch later; every system has its own track.</p>
        <div className="mt-5 flex flex-col gap-2">
          {SYSTEMS.map((s) => {
            const selected = s.id === choice;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setChoice(s.id)}
                className={`flex items-center gap-3 rounded-2xl border-2 bg-white p-3 text-left transition ${selected ? 'border-brand-500 ring-4 ring-brand-100' : 'border-ink-100'}`}
              >
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${selected ? 'border-brand-500 bg-brand-500 text-white' : 'border-ink-300'}`}>{selected ? '✓' : ''}</span>
                <span className="flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-black">{s.name}</span>
                    <LevelPill level={s.level} />
                    {s.recommended && <span className="rounded-full bg-brand-500 px-2 py-0.5 text-[10px] font-black uppercase text-white">Recommended</span>}
                  </span>
                  <span className="mt-0.5 block text-sm font-semibold text-ink-500">{s.tagline}</span>
                </span>
              </button>
            );
          })}
        </div>
        <Button variant="ghost" className="mt-4" onClick={() => navigate('compare')}>
          Compare all systems →
        </Button>
        <div className="sticky bottom-0 mt-4 bg-paper pb-safe pt-2">
          <Button full size="lg" onClick={() => setStep('ready')}>
            Continue
          </Button>
        </div>
      </div>
    );
  }

  const system = getSystem(choice);
  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col px-5 py-8">
      <button type="button" className="self-start text-sm font-bold text-ink-500" onClick={() => setStep('pick')}>
        ← Change system
      </button>
      <h2 className="mt-3 text-3xl font-black">You picked {system.name}</h2>
      <p className="mt-2 font-semibold text-ink-700">{system.description}</p>
      <div className="mt-5 rounded-3xl bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-black uppercase tracking-wide text-ink-500">Card values</h3>
        <ValueChart system={system} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 text-sm font-bold">
        <Fact label="Balanced" value={system.balanced ? 'Yes' : 'No'} />
        <Fact label="True count" value={system.balanced ? 'Needed' : 'Not needed'} />
        <Fact label="Ace side count" value={system.aceSideCount ? 'Recommended' : 'No'} />
        <Fact label="Level" value={system.level[0].toUpperCase() + system.level.slice(1)} />
      </div>
      <div className="mt-auto pt-6">
        <Button full size="lg" variant="success" onClick={() => dispatch({ type: 'completeOnboarding', systemId: choice })}>
          Start learning
        </Button>
      </div>
    </div>
  );
}

function Fact({ label, value }) {
  return (
    <div className="rounded-2xl bg-white p-3 shadow-sm">
      <div className="text-[11px] font-black uppercase tracking-wide text-ink-500">{label}</div>
      <div className="text-ink-900">{value}</div>
    </div>
  );
}
