import Button from '../../components/Button.jsx';

/** Placeholder for lessons that are planned but not built yet. */
export default function StubLesson({ lesson, unit, onBack }) {
  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col px-5 pb-safe pt-4">
      <button type="button" onClick={onBack} className="self-start text-sm font-bold text-ink-500">
        ← Back
      </button>
      <div className="mt-8 flex flex-col items-center text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-ink-100 text-4xl">{unit.icon}</div>
        <span className="mt-4 rounded-full bg-xp-400/30 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-xp-600">Coming soon</span>
        <h1 className="mt-3 text-3xl font-black">{lesson.title}</h1>
        <p className="mt-2 font-semibold text-ink-700">{lesson.blurb}</p>
      </div>
      <div className="mt-6 rounded-3xl bg-white p-4 shadow-sm">
        <h2 className="text-sm font-black uppercase tracking-wide text-ink-500">
          Unit {unit.number} · {unit.title}
        </h2>
        <p className="mt-2 font-semibold text-ink-700">{unit.blurb}</p>
        <ol className="mt-3 space-y-1 text-sm font-bold text-ink-500">
          {unit.lessons.map((l, i) => (
            <li key={l.id} className={l.id === lesson.id ? 'text-ink-900' : ''}>
              {i + 1}. {l.title}
              {l.type !== 'stub' ? ' ✓ built' : ''}
            </li>
          ))}
        </ol>
      </div>
      <p className="mt-4 text-center text-sm font-semibold text-ink-500">This lesson never blocks the path. Unit 3 and Unit 4 are fully playable now.</p>
      <div className="mt-auto pt-6">
        <Button full size="lg" onClick={onBack}>
          Back to path
        </Button>
      </div>
    </div>
  );
}
