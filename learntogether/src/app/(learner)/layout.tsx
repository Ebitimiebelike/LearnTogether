import type { ReactNode } from "react";
import { BottomNavigation } from "@/components/ui/BottomNavigation";
import { Screen } from "@/components/ui/Screen";
import { RequireLearner } from "@/features/learners/RequireLearner";

/**
 * The learner shell: every screen the learner uses sits inside the same page
 * frame with the same four-item navigation, always in the same place.
 */
export default function LearnerLayout({ children }: { children: ReactNode }) {
  return (
    <RequireLearner>
      <Screen withBottomNav>{children}</Screen>
      <BottomNavigation />
    </RequireLearner>
  );
}
