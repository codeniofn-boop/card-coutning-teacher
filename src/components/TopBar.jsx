import { useStore } from '../state/store.jsx';
import { streakAlive } from '../learning/progress.js';

/** Streak, XP and hearts plus a chip showing the active counting system. */
export default function TopBar() {
  const { state, system, hearts, navigate } = useStore();
  const alive = streakAlive(state.streak, Date.now());
  return (
    <header className="sticky top-0 z-20 border-b border-ink-100 bg-paper/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-md items-center justify-between px-4">
        <button
          type="button"
          onClick={() => navigate('compare')}
          className="flex items-center gap-1.5 rounded-full border border-ink-200 bg-white px-3 py-1 text-sm font-extrabold text-ink-700 active:bg-ink-100"
          aria-label="Change counting system"
        >
          <span>🃏</span>
          {system.shortName || system.name}
          <span className="text-ink-300">▾</span>
        </button>
        <div className="flex items-center gap-3 text-sm font-black tabular-nums">
          <span className={`flex items-center gap-1 ${alive ? 'text-flame-500' : 'text-ink-300'}`} title="Day streak">
            <span className={alive ? '' : 'grayscale'}>🔥</span>
            {state.streak.count}
          </span>
          <span className="flex items-center gap-1 text-xp-600" title="XP">
            <span>⚡</span>
            {state.xp}
          </span>
          <span className="flex items-center gap-1 text-heart-500" title="Hearts">
            <span>❤️</span>
            {hearts.count}
          </span>
        </div>
      </div>
    </header>
  );
}
