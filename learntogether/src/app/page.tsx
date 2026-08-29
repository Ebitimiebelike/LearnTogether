"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/features/learners/SessionProvider";
import { useAudio } from "@/hooks/useAudio";
import { Screen } from "@/components/ui/Screen";

/**
 * Splash screen.
 *
 * Also the app's entry point when it is launched from the home screen, so it
 * decides where the learner goes: straight back to Home if they have been here
 * before, otherwise into onboarding. It shows the mark while storage loads,
 * which is normally a single frame.
 */
export default function SplashPage() {
  const router = useRouter();
  const audio = useAudio();
  const { loading, learner, settings } = useSession();
  const playedOpening = useRef(false);

  // The opening flourish, once per launch. Browsers refuse audio before the
  // page has had a user gesture, so on a cold start this is usually deferred
  // to the learner's first tap rather than heard here — which is handled
  // inside the music player.
  useEffect(() => {
    if (loading || playedOpening.current) return;
    playedOpening.current = true;
    if (settings.musicEnabled) audio.playOpeningTheme();
  }, [loading, settings.musicEnabled, audio]);

  useEffect(() => {
    if (loading) return;
    const ready = learner !== null && settings.onboardingComplete;
    router.replace(ready ? "/home" : "/onboarding");
  }, [loading, learner, settings.onboardingComplete, router]);

  return (
    <Screen center className="items-center gap-6 px-8 text-center">
      <span aria-hidden="true" className="text-8xl animate-float">
        📚
      </span>
      <h1 className="text-4xl font-extrabold tracking-tight">LearnTogether</h1>
      <p className="text-xl text-ink-muted">Learn at your own pace.</p>
      <p role="status" className="sr-only">
        Loading LearnTogether
      </p>
    </Screen>
  );
}
