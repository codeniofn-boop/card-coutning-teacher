import { useState } from 'react';
import { useStore } from '../state/store.jsx';
import { BADGES } from '../learning/badges.js';
import { isImplemented, lessonsForSystem } from '../learning/units.js';
import { effectiveSpeedMs, skillAccuracy, streakAlive } from '../learning/progress.js';
import Button from '../components/Button.jsx';
import ProgressBar from '../components/ProgressBar.jsx';

export default function Profile() {
  const { state, system, track, level, dispatch } = useStore();
  const [confirmReset, setConfirmReset] = useState(false);
  const now = Date.now();
  const alive = streakAlive(state.streak, now);
  const earned = new Set(state.badges.map((b) => b.id));
  const lessons = lessonsForSystem(system).filter(isImplemented);

  return (
    <div className="space-y-5">
      <div className="rounded-3xl bg-white p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-500 text-3xl font-black text-white shadow-md">{level.level}</div>
          <div className="flex-1">
            <div className="text-[11px] font-black uppercase tracking-wider text-ink-500">Level {level.level}</div>
            <div className="text-xl font-black">{level.title}</div>
            <div className="text-xs font-bold text-ink-500">
              {level.xpIntoLevel} / {level.xpForLevel} XP to level {level.level + 1}
            </div>
          </div>
        </div>
        <ProgressBar value={level.progress} color="xp" className="mt-3" />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Stat icon="🔥" value={state.streak.count} label={alive ? 'day streak' : 'streak (paused)'} dim={!alive} />
        <Stat icon="⚡" value={state.xp} label="total XP" />
        <Stat icon="🧊" value={state.streak.freezes} label="streak freezes" />
      </div>
      <p className="text-xs font-semibold text-ink-500">
        Longest streak: {state.streak.longest} days. A streak freeze covers one missed day automatically; you earn one for every 7-day streak.
      </p>

      <section>
        <h2 className="mb-2 text-sm font-black uppercase tracking-wide text-ink-500">{system.name} skills</h2>
        <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
          {lessons.map((lesson) => {
            const skill = track.skills[lesson.id];
            const speed = effectiveSpeedMs(lesson, skill, state.settings.speedMultiplier);
            return (
              <div key={lesson.id} className="flex items-center justify-between border-b border-ink-100 px-4 py-3 last:border-b-0">
                <div>
                  <div className="font-black">{lesson.title}</div>
                  <div className="text-xs font-bold text-ink-500">
                    {skill?.attempts ? `${Math.round(skillAccuracy(skill) * 100)}% accuracy · ${skill.attempts} ${skill.attempts === 1 ? 'try' : 'tries'}` : 'Not started'}
                    {skill?.bestTimeMs ? ` · best ${(skill.bestTimeMs / 1000).toFixed(1)}s` : ''}
                    {speed ? ` · ${(speed / 1000).toFixed(1)}s/card` : ''}
                  </div>
                </div>
                <div className="text-sm font-black text-xp-600">{skill?.mastery ? `★${skill.mastery}` : ''}</div>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-black uppercase tracking-wide text-ink-500">
          Badges · {earned.size}/{BADGES.length}
        </h2>
        <div className="grid grid-cols-3 gap-2">
          {BADGES.map((b) => {
            const has = earned.has(b.id);
            return (
              <div key={b.id} className={`rounded-2xl p-3 text-center shadow-sm ${has ? 'bg-white' : 'bg-ink-100'}`} title={b.description}>
                <div className={`text-3xl ${has ? '' : 'grayscale opacity-40'}`}>{b.icon}</div>
                <div className={`mt-1 text-xs font-black ${has ? 'text-ink-900' : 'text-ink-500'}`}>{b.name}</div>
                <div className="mt-0.5 text-[10px] font-semibold leading-tight text-ink-500">{b.description}</div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-3xl bg-white p-4 shadow-sm">
        <h2 className="text-sm font-black uppercase tracking-wide text-ink-500">Settings</h2>
        <label className="mt-3 block">
          <div className="flex justify-between text-sm font-bold">
            <span>Global drill speed</span>
            <span className="tabular-nums text-brand-600">{state.settings.speedMultiplier.toFixed(2)}×</span>
          </div>
          <input
            type="range"
            min="0.6"
            max="1.6"
            step="0.05"
            value={state.settings.speedMultiplier}
            onChange={(e) => dispatch({ type: 'setSpeedMultiplier', value: Number(e.target.value) })}
            className="mt-2 w-full accent-brand-500"
          />
          <div className="flex justify-between text-[11px] font-bold text-ink-500">
            <span>Faster</span>
            <span>Slower</span>
          </div>
        </label>
        <p className="mt-2 text-xs font-semibold text-ink-500">Each timed drill also ramps its own speed up after accurate runs and down after rough ones.</p>
        <label className="mt-4 flex items-center justify-between gap-3">
          <span>
            <span className="block text-sm font-bold">Dealer hits soft 17 (H17)</span>
            <span className="block text-xs font-semibold text-ink-500">Changes a handful of basic strategy plays. Off means S17.</span>
          </span>
          <input
            type="checkbox"
            checked={!!state.settings.dealerHitsSoft17}
            onChange={(e) => dispatch({ type: 'setDealerHitsSoft17', value: e.target.checked })}
            className="h-6 w-6 accent-brand-500"
          />
        </label>
        <label className="mt-4 flex items-center justify-between gap-3">
          <span>
            <span className="block text-sm font-bold">Unlock every lesson</span>
            <span className="block text-xs font-semibold text-ink-500">Skip the path order and try anything. Progress still counts.</span>
          </span>
          <input type="checkbox" checked={!!state.settings.unlockAll} onChange={(e) => dispatch({ type: 'setUnlockAll', value: e.target.checked })} className="h-6 w-6 accent-brand-500" />
        </label>
        <div className="mt-4">
          {confirmReset ? (
            <div className="flex gap-2">
              <Button full variant="danger" onClick={() => dispatch({ type: 'reset' })}>
                Yes, reset everything
              </Button>
              <Button full variant="neutral" onClick={() => setConfirmReset(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button full variant="neutral" onClick={() => setConfirmReset(true)}>
              Reset all progress
            </Button>
          )}
        </div>
      </section>
      <p className="pb-2 text-center text-[11px] font-semibold text-ink-300">Progress is kept in memory for now; reloading the page starts fresh.</p>
    </div>
  );
}

function Stat({ icon, value, label, dim }) {
  return (
    <div className={`rounded-2xl bg-white p-3 text-center shadow-sm ${dim ? 'opacity-60' : ''}`}>
      <div className="text-2xl">{icon}</div>
      <div className="text-xl font-black tabular-nums">{value}</div>
      <div className="text-[10px] font-black uppercase tracking-wide text-ink-500">{label}</div>
    </div>
  );
}
