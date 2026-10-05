import { useStore } from '../state/store.jsx';

const TABS = [
  { name: 'path', label: 'Path', icon: '🗺️' },
  { name: 'review', label: 'Review', icon: '🔁' },
  { name: 'compare', label: 'Systems', icon: '📊' },
  { name: 'profile', label: 'Profile', icon: '👤' },
];

export default function BottomNav() {
  const { state, navigate } = useStore();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-ink-100 bg-white/95 backdrop-blur pb-safe">
      <div className="mx-auto flex max-w-md justify-around">
        {TABS.map((t) => {
          const active = state.screen.name === t.name;
          return (
            <button
              key={t.name}
              type="button"
              onClick={() => navigate(t.name)}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-extrabold uppercase tracking-wide ${active ? 'text-brand-600' : 'text-ink-500'}`}
            >
              <span className={`flex h-9 w-12 items-center justify-center rounded-xl text-xl ${active ? 'bg-brand-50' : ''}`}>{t.icon}</span>
              {t.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
