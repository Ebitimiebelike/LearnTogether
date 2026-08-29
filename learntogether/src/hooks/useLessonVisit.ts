"use client";

import { useEffect, useRef } from "react";
import { useSession } from "@/features/learners/SessionProvider";

/**
 * Records that a lesson was opened, exactly once per visit.
 *
 * Opening a lesson is itself worth a star — simply looking at a letter is real
 * learning — but only the first time in a visit, so leaving a screen open does
 * not accumulate stars. The ref survives StrictMode's double effect invocation.
 */
export function useLessonVisit(itemId: string) {
  const { recordActivity, learner } = useSession();
  const recorded = useRef<string | null>(null);

  useEffect(() => {
    // Wait for the learner to load. Recording before then would be dropped by
    // `recordActivity`, and the ref would stop it ever being retried.
    if (!learner) return;
    if (recorded.current === itemId) return;
    recorded.current = itemId;
    void recordActivity({ kind: "lesson", itemId });
    // `recordActivity` changes identity as progress updates; the ref is what
    // guarantees this runs once, so it is deliberately not a dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemId, learner]);
}
