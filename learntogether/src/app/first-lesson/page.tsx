import { FirstLesson } from "@/features/onboarding/FirstLesson";
import { RequireLearner } from "@/features/learners/RequireLearner";

/**
 * Guarded like the rest of the app: reaching this page directly without having
 * created a learner sends you back to onboarding rather than into a lesson that
 * has nowhere to record its progress.
 */
export default function FirstLessonPage() {
  return (
    <RequireLearner>
      <FirstLesson />
    </RequireLearner>
  );
}
