"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "./SessionProvider";
import { Screen } from "@/components/ui/Screen";

/**
 * Guards the learner and caregiver areas.
 *
 * Every route below the first-run flow needs a learner to exist. Rather than
 * each screen null-checking, they are wrapped once here and sent back to
 * onboarding if there is nobody set up yet.
 */
export function RequireLearner({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { loading, learner } = useSession();

  useEffect(() => {
    if (!loading && !learner) router.replace("/onboarding");
  }, [loading, learner, router]);

  if (loading || !learner) {
    return (
      <Screen center className="items-center gap-4 px-8 text-center">
        <span aria-hidden="true" className="text-6xl animate-float">
          📚
        </span>
        <p role="status" className="text-lg text-ink-muted">
          Just a moment…
        </p>
      </Screen>
    );
  }

  return <>{children}</>;
}
