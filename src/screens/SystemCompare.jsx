import { useState } from 'react';
import { useStore } from '../state/store.jsx';
import { SYSTEMS } from '../game/countingSystems.js';
import Button from '../components/Button.jsx';
import ValueChart from '../components/ValueChart.jsx';
import LevelPill from '../components/LevelPill.jsx';

/**
 * Side-by-side comparison of every counting system, with a switch button.
 * Shown both inside the app shell and standalone during onboarding.
 */
export default function SystemCompare({ standalone = false }) {
  const { state, system, dispatch, navigate } = useStore();
  const [expanded, setExpanded] = useState(null);

  const choose = (id) => {
    if (!state.onboarded) dispatch({ type: 'completeOnboarding', systemId: id });
    else {
      dispatch({ type: 'setSystem', systemId: id });
      navigate('path');
    }
  };

  const body = (
    <div>
      <h1 className="text-3xl font-black">Counting systems</h1>
      <p className="mt-2 font-semibold text-ink-500">
        Every system trades simplicity for accuracy somewhere. Figures are the commonly published correlations, rounded; they are a guide, not gospel.
      </p>
      <div className="mt-4 grid grid-cols-3 gap-2 text-[11px] font-bold text-ink-500">
        <Legend label="BC" text="Betting correlation: how well the count predicts when to bet big." />
        <Legend label="PE" text="Playing efficiency: how well it guides hit/stand decisions." />
        <Legend label="IC" text="Insurance correlation: how well it spots insurance bets." />
      </div>

      <div className="mt-5 flex flex-col gap-3">
        {SYSTEMS.map((s) => {
          const current = state.onboarded && s.id === system.id;
          const open = expanded === s.id;
          return (
            <div key={s.id} className={`rounded-3xl border-2 bg-white p-4 shadow-sm ${current ? 'border-brand-500' : 'border-transparent'}`}>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-black">{s.name}</h2>
                <LevelPill level={s.level} />
                {s.recommended && <span className="rounded-full bg-brand-500 px-2 py-0.5 text-[10px] font-black uppercase text-white">Recommended</span>}
                {current && <span className="rounded-full bg-good-500 px-2 py-0.5 text-[10px] font-black uppercase text-white">Current</span>}
              </div>
              <p className="mt-1 text-sm font-semibold text-ink-500">{s.tagline}</p>

              <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] font-black uppercase tracking-wide">
                <Tag ok={s.balanced}>{s.balanced ? 'Balanced' : 'Unbalanced'}</Tag>
                <Tag ok={!s.balanced}>{s.balanced ? 'True count needed' : 'No true count'}</Tag>
                <Tag ok={!s.aceSideCount}>{s.aceSideCount ? 'Ace side count' : 'No side count'}</Tag>
                <Tag ok={levelCount(s) === 1}>Level {levelCount(s)}</Tag>
              </div>

              <div className="mt-3 space-y-1.5">
                <Metric label="BC" value={s.bc} />
                <Metric label="PE" value={s.pe} />
                <Metric label="IC" value={s.ic} />
              </div>

              {open && (
                <div className="mt-3 rounded-2xl bg-paper p-3">
                  <p className="mb-3 text-sm font-semibold text-ink-700">{s.description}</p>
                  <ValueChart system={s} compact />
                </div>
              )}

              <div className="mt-3 flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setExpanded(open ? null : s.id)}>
                  {open ? 'Hide values' : 'Show values'}
                </Button>
                <div className="flex-1" />
                {current ? (
                  <Button variant="neutral" size="sm" disabled>
                    Using
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => choose(s.id)}>
                    {state.onboarded ? 'Switch' : 'Choose'}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  if (!standalone) return body;
  return (
    <div className="mx-auto min-h-full max-w-md px-5 py-6">
      <button type="button" className="mb-4 text-sm font-bold text-ink-500" onClick={() => navigate('onboarding', { step: 'pick' })}>
        ← Back
      </button>
      {body}
    </div>
  );
}

function levelCount(system) {
  let max = 0;
  for (const tag of Object.values(system.values)) {
    const vals = typeof tag === 'number' ? [tag] : [tag.red, tag.black];
    for (const v of vals) max = Math.max(max, Math.abs(v));
  }
  return Math.ceil(max);
}

function Legend({ label, text }) {
  return (
    <div className="rounded-xl bg-white p-2 shadow-sm">
      <span className="font-black text-ink-900">{label}</span> {text}
    </div>
  );
}

function Tag({ ok, children }) {
  return <span className={`rounded-full px-2 py-0.5 ${ok ? 'bg-good-100 text-good-600' : 'bg-ink-100 text-ink-500'}`}>{children}</span>;
}

function Metric({ label, value }) {
  return (
    <div className="flex items-center gap-2 text-xs font-black">
      <span className="w-6 text-ink-500">{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink-100">
        <div className="h-full rounded-full bg-brand-500" style={{ width: `${value * 100}%` }} />
      </div>
      <span className="w-9 text-right tabular-nums">{value.toFixed(2)}</span>
    </div>
  );
}
