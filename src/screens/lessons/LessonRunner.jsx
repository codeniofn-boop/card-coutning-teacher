import { useMemo, useRef, useState } from 'react';
import { useStore } from '../../state/store.jsx';
import { getLesson, getUnit } from '../../learning/units.js';
import { DEFAULT_PASS_ACCURACY, effectiveSpeedMs, msUntilNextHeart } from '../../learning/progress.js';
import LessonIntro from './LessonIntro.jsx';
import DrillHeader from './DrillHeader.jsx';
import CardValuesDrill from './CardValuesDrill.jsx';
import StrategyDrill from './StrategyDrill.jsx';
import CancellationDrill from './CancellationDrill.jsx';
import { DEFAULT_RULES } from '../../game/basicStrategy.js';
import RunningCountDrill from './RunningCountDrill.jsx';
import ReadingLesson from './ReadingLesson.jsx';
import TableSim from './TableSim.jsx';
import { DeckEstimationDrill, TrueCountDrill, BetDrill, DeviationDrill } from './EstimationDrills.jsx';
import StubLesson from './StubLesson.jsx';
import Button from '../../components/Button.jsx';
import Sheet from '../../components/Sheet.jsx';

const DRILLS = {
  strategy: StrategyDrill,
  cardValues: CardValuesDrill,
  runningCount: RunningCountDrill,
  cancellation: CancellationDrill,
  reading: ReadingLesson,
  deckEstimation: DeckEstimationDrill,
  trueCount: TrueCountDrill,
  bet: BetDrill,
  deviation: DeviationDrill,
  table: TableSim,
};

/**
 * Runs one lesson: intro → drill → (result dispatched to the store).
 * Owns hearts for the session, the adaptive speed and the quit flow.
 * Every drill gets the same props: { lesson, system, speedMs, onMistake, onFinish, onProgress }.
 */
export default function LessonRunner({ lessonId, review }) {
  const { state, system, track, hearts, dispatch, navigate } = useStore();
  const lesson = getLesson(lessonId);
  const unit = lesson ? getUnit(lesson.unitId) : null;
  const skill = track.skills[lessonId];
  const usesHearts = !review && lesson?.type !== 'reading';

  const [phase, setPhase] = useState(() => (usesHearts && hearts.count <= 0 ? 'outOfHearts' : 'intro'));
  const [speedMs, setSpeedMs] = useState(() => (lesson ? effectiveSpeedMs(lesson, skill, state.settings.speedMultiplier) : null));
  const [progress, setProgress] = useState(0);
  const [confirmQuit, setConfirmQuit] = useState(false);
  const [heartsLeft, setHeartsLeft] = useState(hearts.count);
  const heartsRef = useRef(hearts.count);
  const startedAt = useRef(0);
  const rules = useMemo(() => ({ ...DEFAULT_RULES, dealerHitsSoft17: !!state.settings.dealerHitsSoft17 }), [state.settings.dealerHitsSoft17]);

  if (!lesson) {
    return (
      <div className="mx-auto max-w-md p-6 text-center">
        <p className="font-bold">That lesson doesn’t exist.</p>
        <Button className="mt-4" onClick={() => navigate('path')}>
          Back to path
        </Button>
      </div>
    );
  }
  if (lesson.type === 'stub') return <StubLesson lesson={lesson} unit={unit} onBack={() => navigate('path')} />;

  const Drill = DRILLS[lesson.type];

  const onMistake = () => {
    if (!usesHearts) return;
    dispatch({ type: 'loseHeart' });
    heartsRef.current -= 1;
    setHeartsLeft(heartsRef.current);
    if (heartsRef.current <= 0) setPhase('outOfHearts');
  };

  const onFinish = (raw) => {
    const durationMs = raw.durationMs ?? Date.now() - startedAt.current;
    const accuracy = raw.total ? raw.correct / raw.total : 0;
    const passed = accuracy >= (lesson.passAccuracy ?? DEFAULT_PASS_ACCURACY);
    const result = { ...raw, accuracy, passed, durationMs, speedMs: lesson.config?.baseSpeedMs ? speedMs : null };
    dispatch({ type: 'lessonComplete', lessonId, result, review });
  };

  const changeSpeed = (ms) => {
    setSpeedMs(ms);
    // Store the unmultiplied value so the global multiplier still applies on top.
    dispatch({ type: 'setSkillSpeed', lessonId, speedMs: Math.round(ms / (state.settings.speedMultiplier || 1)) });
  };

  if (phase === 'outOfHearts') {
    const minutes = Math.max(1, Math.ceil(msUntilNextHeart(state.hearts, Date.now()) / 60000));
    return (
      <div className="mx-auto flex min-h-full max-w-md flex-col items-center justify-center px-6 text-center">
        <div className="text-6xl">💔</div>
        <h1 className="mt-4 text-3xl font-black">Out of hearts</h1>
        <p className="mt-2 font-semibold text-ink-500">
          Hearts come back one every 30 minutes (next in about {minutes} min). Or do a review session: it never costs hearts and refills them when you finish.
        </p>
        <Button full size="lg" variant="xp" className="mt-6" onClick={() => navigate('review')}>
          Practice to refill
        </Button>
        <Button full variant="ghost" className="mt-2" onClick={() => navigate('path')}>
          Back to path
        </Button>
      </div>
    );
  }

  if (phase === 'intro') {
    return (
      <LessonIntro
        lesson={lesson}
        unit={unit}
        system={system}
        review={review}
        rules={rules}
        speedMs={speedMs}
        onSpeedChange={changeSpeed}
        onStart={() => {
          startedAt.current = Date.now();
          setPhase('drill');
        }}
        onQuit={() => navigate('path')}
      />
    );
  }

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col px-4 pb-safe pt-3">
      <DrillHeader progress={progress} hearts={usesHearts ? heartsLeft : null} review={review} onQuit={() => setConfirmQuit(true)} />
      <Drill lesson={lesson} system={system} rules={rules} speedMs={speedMs} onMistake={onMistake} onFinish={onFinish} onProgress={setProgress} />
      <Sheet open={confirmQuit} onClose={() => setConfirmQuit(false)} title="Quit this lesson?">
        <p className="font-semibold text-ink-500">Progress in this lesson will be lost.</p>
        <div className="mt-4 flex flex-col gap-2">
          <Button variant="danger" full onClick={() => navigate('path')}>
            Quit
          </Button>
          <Button variant="neutral" full onClick={() => setConfirmQuit(false)}>
            Keep going
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
