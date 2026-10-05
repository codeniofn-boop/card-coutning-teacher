import ProgressBar from '../../components/ProgressBar.jsx';

export default function DrillHeader({ progress, hearts, review, onQuit }) {
  return (
    <div className="flex items-center gap-3">
      <button type="button" onClick={onQuit} aria-label="Quit lesson" className="px-1 text-2xl font-black text-ink-300 active:text-ink-500">
        ✕
      </button>
      <ProgressBar value={progress} color="good" className="flex-1" height="h-4" />
      {hearts != null ? (
        <span className="flex items-center gap-1 text-lg font-black tabular-nums text-heart-500">
          ❤️ {hearts}
        </span>
      ) : (
        <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-black uppercase text-brand-600">{review ? 'Review' : 'No hearts'}</span>
      )}
    </div>
  );
}
