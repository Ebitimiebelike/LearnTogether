import type { ReactNode } from "react";
import { Screen } from "@/components/ui/Screen";
import { RequireLearner } from "@/features/learners/RequireLearner";

/**
 * The caregiver shell. No bottom navigation: this area is for an adult, and
 * keeping the learner's navigation out of it makes the boundary obvious.
 */
export default function CaregiverLayout({ children }: { children: ReactNode }) {
  return (
    <RequireLearner>
      <Screen>{children}</Screen>
    </RequireLearner>
  );
}
