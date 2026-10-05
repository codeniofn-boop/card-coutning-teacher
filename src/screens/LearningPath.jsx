import { useState } from 'react';
import { useStore } from '../state/store.jsx';
import { UNITS, lessonStatus, nextLesson, unitAvailability, unitProgress } from '../learning/units.js';
import { effectiveSpeedMs, msUntilNextHeart, needsReview, skillAccuracy, skillStrength } from '../learning/progress.js';
import Button from '../components/Button.jsx';
import Sheet from '../components/Sheet.jsx';
import ProgressBar from '../components/ProgressBar.jsx';

/** Horizontal offsets that make the path snake down the screen. */
const OFFSETS = [0, 46, 72, 46, 0, -46, -72, -46];

const UNIT_COLORS = [
  { bg: 'bg-brand-500', border: 'border-brand-700', text: 'text-brand-600', soft: 'bg-brand-50' },
  { bg: 'bg-good-500', border: 'border-good-600', text: 'text-good-600', soft: 'bg-good-100' },
  { bg: 'bg-sky-500', border: 'border-sky-700', text: 'text-sky-600', soft: 'bg-sky-100' },
  { bg: 'bg-violet-500', border: 'border-violet-700', text: 'text-violet-600', soft: 'bg-violet-100' },
  { bg: 'bg-flame-500', border: 'border-flame-600', text: 'text-flame-600', soft: 'bg-orange-100' },
  { bg: 'bg-pink-500', border: 'border-pink-700', text: 'text-pink-600', soft: 'bg-pink-100' },
  { bg: 'bg-teal-500', border: 'border-teal-700', text: 'text-teal-600', soft: 'bg-teal-100' },
  { bg: 'bg-amber-500', border: 'border-amber-700', text: 'text-amber-600', soft: 'bg-amber-100' },
  { bg: 'bg-indigo-500', border: 'border-indigo-700', text: 'text-indigo-600', soft: 'bg-indigo-100' },
  { bg: 'bg-rose-500', border: 'border-rose-700', text: 'text-rose-600', soft: 'bg-rose-100' },
  { bg: 'bg-emerald-600', border: 'border-emerald-800', text: 'text-emerald-700', soft: 'bg-emerald-100' },
];

export default function LearningPath() {
  const { system, track, hearts, navigate } = useStore();
  const [selected, setSelected] = useState(null);
  const now = Date.now();
  const next = nextLesson(track, system);
  let nodeIndex = 0;

  return (
    <div>
      {UNITS.map((unit, u) => {
        const color = UNIT_COLORS[u % UNIT_COLORS.length];
        const avail = unitAvailability(unit, system);
        const prog = unitProgress(unit, track);
        return (
          <section key={unit.id} className="mb-4">
            <UnitHeader unit={unit} color={color} avail={avail} prog={prog} />
            <div className="flex flex-col items-center gap-6 py-6">
              {unit.lessons.map((lesson) => {
                const status = avail.available ? lessonStatus(lesson.id, track, system) : 'skipped';
                const offset = OFFSETS[nodeIndex++ % OFFSETS.length];
                const skill = track.skills[lesson.id];
                const review = status === 'completed' && needsReview(skill, now);
                return (
                  <PathNode
                    key={lesson.id}
                    lesson={lesson}
                    unit={unit}
                    status={status}
                    review={review}
                    isNext={next?.id === lesson.id}
                    offset={offset}
                    mastery={skill?.mastery || 0}
                    color={color}
                    onClick={() => setSelected({ lesson, unit, status, review, color })}
                  />
                );
              })}
            </div>
          </section>
        );
      })}

      <LessonSheet
        selection={selected}
        onClose={() => setSelected(null)}
        hearts={hearts}
        skill={selected ? track.skills[selected.lesson.id] : null}
        onStart={(review) => {
          navigate('lesson', { lessonId: selected.lesson.id, review, nonce: Date.now() });
          setSelected(null);
        }}
        onReview={() => navigate('review')}
      />
    </div>
  );
}

function UnitHeader({ unit, color, avail, prog }) {
  return (
    <div className={`rounded-3xl ${avail.available ? color.bg : 'bg-ink-300'} p-4 text-white shadow-md`}>
      <div className="flex items-start gap-3">
        <span className="text-3xl">{unit.icon}</span>
        <div className="flex-1">
          <div className="text-[11px] font-black uppercase tracking-wider opacity-80">Unit {unit.number}</div>
          <h2 className="text-lg font-black leading-tight">{unit.title}</h2>
          <p className="mt-1 text-sm font-semibold opacity-90">{avail.available ? unit.blurb : avail.reason}</p>
        </div>
      </div>
      {avail.available && (
        <div className="mt-3 flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/30">
            <div className="h-full rounded-full bg-white transition-[width]" style={{ width: `${prog.total ? (prog.done / prog.total) * 100 : 0}%` }} />
          </div>
          <span className="text-xs font-black">{prog.built ? `${prog.done}/${prog.total}` : 'Coming soon'}</span>
        </div>
      )}
    </div>
  );
}

function PathNode({ lesson, unit, status, review, isNext, offset, mastery, color, onClick }) {
  let face = 'btn-3d h-[76px] w-[76px] rounded-full border-b-[6px] text-3xl normal-case';
  let icon = unit.icon;
  if (status === 'completed') {
    face += review ? ' bg-amber-400 border-amber-600 text-white' : ' bg-xp-500 border-xp-600 text-white';
    icon = review ? '!' : '✓';
  } else if (status === 'available') {
    face += ` ${color.bg} ${color.border} text-white`;
  } else if (status === 'locked') {
    face += ' bg-ink-200 border-ink-300 text-ink-400';
    icon = '🔒';
  } else if (status === 'soon') {
    face = 'h-[76px] w-[76px] rounded-full border-2 border-dashed border-ink-300 bg-white text-xl text-ink-300';
    icon = '…';
  } else {
    face += ' bg-ink-100 border-ink-200 text-ink-300 opacity-60';
    icon = '–';
  }

  return (
    <div className="relative flex flex-col items-center" style={{ transform: `translateX(${offset}px)` }}>
      {isNext && (
        <div className={`absolute -top-9 animate-float rounded-xl border-2 bg-white px-3 py-1 text-xs font-black uppercase tracking-wider ${color.text} ${color.border}`}>
          Start
          <span className="absolute left-1/2 top-full -ml-1.5 h-0 w-0 border-x-[6px] border-t-[6px] border-x-transparent border-t-current" />
        </div>
      )}
      {status === 'available' && <span className={`absolute left-0 top-0 h-[76px] w-[76px] rounded-full ${color.bg} animate-ping-ring opacity-60`} />}
      <button type="button" onClick={onClick} className={`relative ${face} flex items-center justify-center`} aria-label={lesson.title}>
        <span className={status === 'completed' ? 'font-black' : ''}>{icon}</span>
        {status === 'completed' && mastery > 0 && (
          <span className="absolute -bottom-1 -right-1 flex h-7 min-w-7 items-center justify-center rounded-full border-2 border-white bg-ink-900 px-1 text-[11px] font-black text-xp-400">
            ★{mastery}
          </span>
        )}
      </button>
      <span className={`mt-2 max-w-[120px] text-center text-xs font-extrabold leading-tight ${status === 'skipped' ? 'text-ink-300 line-through' : 'text-ink-700'}`}>{lesson.title}</span>
    </div>
  );
}

function LessonSheet({ selection, onClose, hearts, skill, onStart, onReview }) {
  if (!selection) return <Sheet open={false} />;
  const { lesson, unit, status, review } = selection;
  const now = Date.now();
  const strength = skillStrength(skill, now);
  const accuracy = skillAccuracy(skill);
  const noHearts = hearts.count <= 0;
  const speed = effectiveSpeedMs(lesson, skill);
  const minutes = Math.ceil(msUntilNextHeart({ ...hearts }, now) / 60000);

  return (
    <Sheet open onClose={onClose}>
      <div className="text-[11px] font-black uppercase tracking-wider text-ink-500">
        Unit {unit.number} · {unit.title}
      </div>
      <h2 className="mt-1 text-2xl font-black">{lesson.title}</h2>
      <p className="mt-1 font-semibold text-ink-700">{lesson.blurb}</p>
      {lesson.goal && (
        <p className="mt-3 rounded-2xl bg-brand-50 px-3 py-2 text-sm font-bold text-brand-700">
          🎯 Goal: {lesson.goal}
        </p>
      )}

      {status === 'completed' && (
        <div className="mt-4 space-y-2 rounded-2xl bg-paper p-3 text-sm font-bold">
          <div className="flex items-center justify-between">
            <span>Strength</span>
            <span className={review ? 'text-amber-600' : 'text-good-600'}>{Math.round(strength * 100)}%{review ? ' · needs review' : ''}</span>
          </div>
          <ProgressBar value={strength} color={review ? 'xp' : 'good'} height="h-2" />
          <div className="flex items-center justify-between text-ink-500">
            <span>Accuracy {Math.round(accuracy * 100)}%</span>
            {skill?.bestTimeMs && <span>Best {(skill.bestTimeMs / 1000).toFixed(1)}s</span>}
            {speed && <span>Speed {(speed / 1000).toFixed(1)}s</span>}
          </div>
        </div>
      )}

      <div className="mt-5 space-y-2">
        {status === 'available' && !noHearts && (
          <Button full size="lg" onClick={() => onStart(false)}>
            Start · +{lesson.xp} XP
          </Button>
        )}
        {status === 'completed' && !noHearts && (
          <Button full size="lg" variant={review ? 'xp' : 'primary'} onClick={() => onStart(false)}>
            {review ? 'Review now' : 'Practice again'} · +{lesson.xp} XP
          </Button>
        )}
        {(status === 'available' || status === 'completed') && noHearts && (
          <>
            <p className="text-center text-sm font-bold text-heart-500">You’re out of hearts. Next one in {minutes} min, or refill with a review session.</p>
            <Button full size="lg" variant="xp" onClick={onReview}>
              Review to refill hearts
            </Button>
          </>
        )}
        {status === 'completed' && (
          <Button full variant="secondary" onClick={() => onStart(true)}>
            Quick practice · no hearts · +{Math.floor(lesson.xp / 2)} XP
          </Button>
        )}
        {status === 'locked' && (
          <Button full size="lg" variant="neutral" disabled>
            🔒 Finish the lessons before this one
          </Button>
        )}
        {status === 'soon' && (
          <>
            <p className="text-center text-sm font-bold text-ink-500">This lesson hasn’t been built yet. It never blocks the path.</p>
            <Button full variant="secondary" onClick={() => onStart(false)}>
              Preview
            </Button>
          </>
        )}
        {status === 'skipped' && <p className="text-center text-sm font-bold text-ink-500">Not part of this system’s track.</p>}
      </div>
    </Sheet>
  );
}
