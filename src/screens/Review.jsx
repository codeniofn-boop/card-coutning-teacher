import { useStore } from '../state/store.jsx';
import { isImplemented, lessonsForSystem } from '../learning/units.js';
import { skillAccuracy, skillStrength, weakestSkills } from '../learning/progress.js';
import Button from '../components/Button.jsx';
import ProgressBar from '../components/ProgressBar.jsx';

/** Spaced-repetition review: surfaces the weakest practised skills. */
export default function Review() {
  const { track, system, navigate } = useStore();
  const now = Date.now();
  const lessons = lessonsForSystem(system).filter(isImplemented);
  const practised = lessons.filter((l) => track.skills[l.id]?.completions > 0);
  const weakest = weakestSkills(track, lessons, now, 3);

  const start = (lessonId) => navigate('lesson', { lessonId, review: true, nonce: Date.now() });

  if (practised.length === 0) {
    return (
      <div className="rounded-3xl bg-white p-6 text-center shadow-sm">
        <div className="text-5xl">🔁</div>
        <h1 className="mt-3 text-2xl font-black">Nothing to review yet</h1>
        <p className="mt-2 font-semibold text-ink-500">Finish a lesson and it shows up here with a strength meter that fades over time. Review sessions never cost hearts and refill them when you finish.</p>
        <Button className="mt-5" onClick={() => navigate('path')}>
          Go to the path
        </Button>
      </div>
    );
  }

  const target = weakest[0];
  return (
    <div>
      <div className="rounded-3xl bg-brand-500 p-5 text-white shadow-md">
        <div className="text-[11px] font-black uppercase tracking-wider opacity-80">Review session</div>
        <h1 className="mt-1 text-2xl font-black">Sharpen your weakest skill</h1>
        <p className="mt-2 text-sm font-semibold opacity-90">
          Up next: <span className="font-black">{target.lesson.title}</span> at {Math.round(target.strength * 100)}% strength. No hearts at stake, half XP, and your hearts refill when you finish.
        </p>
        <Button full variant="xp" className="mt-4" onClick={() => start(target.lesson.id)}>
          Start review
        </Button>
      </div>

      <button type="button" onClick={() => navigate('deckDash')} className="mt-3 flex w-full items-center gap-3 rounded-3xl border-2 border-ink-100 bg-white p-4 text-left shadow-sm active:bg-ink-100">
        <span className="text-3xl">⏱️</span>
        <span className="flex-1">
          <span className="block font-black">Deck Dash</span>
          <span className="block text-sm font-semibold text-ink-500">Count a full deck against a clock you choose.</span>
        </span>
        <span className="text-ink-300">›</span>
      </button>

      <h2 className="mb-2 mt-6 text-sm font-black uppercase tracking-wide text-ink-500">Skill strength</h2>
      <div className="flex flex-col gap-2">
        {practised.map((lesson) => {
          const skill = track.skills[lesson.id];
          const strength = skillStrength(skill, now);
          const accuracy = skillAccuracy(skill);
          const weak = strength < 0.5;
          return (
            <div key={lesson.id} className="rounded-2xl bg-white p-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-black">{lesson.title}</div>
                  <div className="text-xs font-bold text-ink-500">
                    {Math.round(accuracy * 100)}% accuracy · ★{skill.mastery}
                  </div>
                </div>
                <Button size="sm" variant={weak ? 'xp' : 'secondary'} onClick={() => start(lesson.id)}>
                  Practice
                </Button>
              </div>
              <ProgressBar value={strength} color={weak ? 'xp' : 'good'} height="h-2" className="mt-2" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
