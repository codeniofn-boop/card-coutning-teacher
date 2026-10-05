/**
 * store.jsx — all app state, in memory.
 *
 * A single reducer owns navigation, the chosen counting system, XP, hearts,
 * the streak, per-system skill tracks, badges and lesson history. Persistence
 * can be bolted on later by serialising `state` (everything is plain JSON).
 */
import { createContext, useContext, useMemo, useReducer, useCallback } from 'react';
import { getSystem } from '../game/countingSystems.js';
import { getLesson } from '../learning/units.js';
import {
  applyResultToSkill,
  emptySkill,
  emptyStreak,
  fullHearts,
  heartsNow,
  levelInfo,
  loseHeart,
  maybeAwardFreeze,
  updateStreak,
  xpForResult,
} from '../learning/progress.js';
import { newlyEarnedBadges } from '../learning/badges.js';

const StoreContext = createContext(null);

export function initialState(now = Date.now()) {
  return {
    onboarded: false,
    systemId: 'hilo',
    screen: { name: 'onboarding' },
    xp: 0,
    hearts: fullHearts(now),
    streak: emptyStreak(),
    tracks: {}, // systemId → { skills: { lessonId → skill } }
    badges: [], // { id, earnedAt }
    history: [], // { lessonId, systemId, at, accuracy, passed, review, xp }
    lastCompletion: null,
    settings: { speedMultiplier: 1 },
  };
}

function ensureTrack(tracks, systemId) {
  return tracks[systemId] || { skills: {} };
}

export function reducer(state, action) {
  const now = action.now ?? Date.now();
  switch (action.type) {
    case 'navigate':
      return { ...state, screen: action.screen };

    case 'completeOnboarding':
      return {
        ...state,
        onboarded: true,
        systemId: action.systemId,
        tracks: { ...state.tracks, [action.systemId]: ensureTrack(state.tracks, action.systemId) },
        screen: { name: 'path' },
      };

    case 'setSystem':
      return {
        ...state,
        systemId: action.systemId,
        tracks: { ...state.tracks, [action.systemId]: ensureTrack(state.tracks, action.systemId) },
      };

    case 'loseHeart':
      return { ...state, hearts: loseHeart(state.hearts, now) };

    case 'refillHearts':
      return { ...state, hearts: fullHearts(now) };

    case 'setSkillSpeed': {
      const track = ensureTrack(state.tracks, state.systemId);
      const skill = track.skills[action.lessonId] || null;
      const next = { ...emptySkill(), ...(skill || {}), speedMs: action.speedMs };
      return { ...state, tracks: { ...state.tracks, [state.systemId]: { ...track, skills: { ...track.skills, [action.lessonId]: next } } } };
    }

    case 'setSpeedMultiplier':
      return { ...state, settings: { ...state.settings, speedMultiplier: action.value } };

    case 'lessonComplete': {
      const lesson = getLesson(action.lessonId);
      if (!lesson) return state;
      const review = !!action.review;
      const result = action.result;
      const track = ensureTrack(state.tracks, state.systemId);
      const prevSkill = track.skills[lesson.id] || null;
      const skill = applyResultToSkill(prevSkill, lesson, result, now);
      const tracks = { ...state.tracks, [state.systemId]: { ...track, skills: { ...track.skills, [lesson.id]: skill } } };

      const xpGain = xpForResult(lesson, result, { review });
      const xp = state.xp + xpGain.total;
      const levelBefore = levelInfo(state.xp).level;
      const levelAfter = levelInfo(xp).level;

      const streakUpdate = updateStreak(state.streak, now);
      const freeze = maybeAwardFreeze(streakUpdate.streak, streakUpdate.event);

      const entry = { lessonId: lesson.id, systemId: state.systemId, at: now, accuracy: result.accuracy, passed: result.passed, review, xp: xpGain.total };
      const history = [...state.history, entry];

      // Review sessions refill hearts — practice is how you earn them back.
      const hearts = review ? fullHearts(now) : heartsNow(state.hearts, now);

      const ctx = { xp, streak: freeze.streak, track: tracks[state.systemId], tracks, history, lesson, result };
      const earnedIds = newlyEarnedBadges(ctx, state.badges);
      const badges = [...state.badges, ...earnedIds.map((id) => ({ id, earnedAt: now }))];

      return {
        ...state,
        xp,
        hearts,
        streak: freeze.streak,
        tracks,
        badges,
        history,
        lastCompletion: {
          lessonId: lesson.id,
          result,
          review,
          xpGain,
          levelUp: levelAfter > levelBefore ? levelAfter : null,
          streakEvent: streakUpdate.event,
          streakCount: freeze.streak.count,
          freezeAwarded: freeze.awarded,
          newBadges: earnedIds,
          skill,
          previousSkill: prevSkill,
        },
        screen: { name: 'lessonComplete' },
      };
    }

    case 'reset':
      return initialState(now);

    default:
      return state;
  }
}

export function StoreProvider({ children, initial }) {
  const [state, rawDispatch] = useReducer(reducer, initial || initialState());
  const dispatch = useCallback((action) => rawDispatch({ now: Date.now(), ...action }), []);
  const value = useMemo(() => ({ state, dispatch }), [state, dispatch]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

/** Access the store plus a few derived conveniences. */
export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  const { state, dispatch } = ctx;
  const system = getSystem(state.systemId);
  const track = state.tracks[state.systemId] || { skills: {} };
  const hearts = heartsNow(state.hearts, Date.now());
  const navigate = useCallback((name, params = {}) => dispatch({ type: 'navigate', screen: { name, ...params } }), [dispatch]);
  return { state, dispatch, system, track, hearts, navigate, level: levelInfo(state.xp) };
}
