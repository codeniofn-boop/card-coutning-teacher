import { useStore } from './state/store.jsx';
import Shell from './components/Shell.jsx';
import Onboarding from './screens/Onboarding.jsx';
import LearningPath from './screens/LearningPath.jsx';
import SystemCompare from './screens/SystemCompare.jsx';
import Review from './screens/Review.jsx';
import Profile from './screens/Profile.jsx';
import LessonRunner from './screens/lessons/LessonRunner.jsx';
import LessonComplete from './screens/lessons/LessonComplete.jsx';

/** Tiny screen switch; navigation state lives in the store. */
export default function App() {
  const { state } = useStore();
  const { screen } = state;

  if (!state.onboarded) {
    if (screen.name === 'compare') return <SystemCompare standalone />;
    return <Onboarding />;
  }

  switch (screen.name) {
    case 'compare':
      return (
        <Shell>
          <SystemCompare />
        </Shell>
      );
    case 'review':
      return (
        <Shell>
          <Review />
        </Shell>
      );
    case 'profile':
      return (
        <Shell>
          <Profile />
        </Shell>
      );
    case 'lesson':
      return <LessonRunner key={`${screen.lessonId}-${screen.nonce || 0}`} lessonId={screen.lessonId} review={!!screen.review} />;
    case 'lessonComplete':
      return <LessonComplete />;
    case 'path':
    default:
      return (
        <Shell>
          <LearningPath />
        </Shell>
      );
  }
}
