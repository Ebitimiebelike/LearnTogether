"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/features/learners/SessionProvider";
import { useAudio } from "@/hooks/useAudio";
import { InstallAppButton } from "@/components/pwa/InstallAppButton";
import { Button } from "@/components/ui/Button";
import { Screen } from "@/components/ui/Screen";
import { useIsStandalone } from "@/hooks/useInstallApp";

/**
 * The entry point, which does one of two things.
 *
 * For anyone who already uses the app — launched from the home screen, or
 * returning in a browser with a learner already set up — it is a splash that
 * routes straight on to Home or onboarding. Nobody should have to walk past a
 * landing page to reach a lesson.
 *
 * For a first-time visitor in a browser it is a welcome page, whose job is to
 * get the app installed onto the device. That is the only audience for which
 * an extra screen earns its place.
 */

const FEATURES = [
  { emoji: "📶", text: "Works with no internet once installed" },
  { emoji: "🔊", text: "Every letter and number is read aloud" },
  { emoji: "✍️", text: "Trace letters and numbers with a finger" },
  { emoji: "🔒", text: "No ads, no account, nothing leaves the device" },
];

export default function LandingPage() {
  const router = useRouter();
  const audio = useAudio();
  const { loading, learner, settings } = useSession();
  const playedOpening = useRef(false);
  const standalone = useIsStandalone();

  // The opening flourish, once per launch. Browsers refuse audio before the
  // page has had a user gesture, so on a cold start this is usually deferred
  // to the first tap — handled inside the music player.
  useEffect(() => {
    if (loading || playedOpening.current) return;
    playedOpening.current = true;
    if (settings.musicEnabled) audio.playOpeningTheme();
  }, [loading, settings.musicEnabled, audio]);

  const returning = learner !== null && settings.onboardingComplete;
  // The welcome is only for someone who has never started. A learner who set up
  // a profile but has not finished onboarding is sent back to finish it, rather
  // than being shown a page inviting them to begin.
  const showWelcome = !standalone && learner === null;

  useEffect(() => {
    if (loading || showWelcome) return;
    router.replace(returning ? "/home" : "/onboarding");
  }, [loading, showWelcome, returning, router]);

  if (loading || !showWelcome) {
    return (
      <Screen center className="items-center gap-6 px-8 text-center">
        <span aria-hidden="true" className="text-8xl animate-float">
          📚
        </span>
        <h1 className="text-4xl font-extrabold tracking-tight">
          LearnTogether
        </h1>
        <p className="text-xl text-ink-muted">Learn at your own pace.</p>
        <p role="status" className="sr-only">
          Loading LearnTogether
        </p>
      </Screen>
    );
  }

  return (
    <Screen className="justify-center gap-8 px-6 py-10">
      <header className="flex flex-col items-center gap-4 text-center">
        <span aria-hidden="true" className="text-7xl animate-float">
          📚
        </span>
        <h1 className="text-4xl font-extrabold tracking-tight">
          LearnTogether
        </h1>
        <p className="max-w-md text-xl text-ink-muted">
          Letters, numbers and tracing practice — built to be calm, patient and
          easy to tap.
        </p>
      </header>

      <ul className="flex flex-col gap-3 landscape:grid landscape:grid-cols-2">
        {FEATURES.map((feature) => (
          <li
            key={feature.text}
            className="flex items-center gap-4 rounded-card bg-surface px-5 py-4 shadow-card"
          >
            <span aria-hidden="true" className="text-3xl leading-none">
              {feature.emoji}
            </span>
            <span className="text-lg font-semibold">{feature.text}</span>
          </li>
        ))}
      </ul>

      <div className="flex flex-col gap-3 landscape:mx-auto landscape:w-full landscape:max-w-xl">
        <InstallAppButton />
        <Button
          size="lg"
          variant="secondary"
          fullWidth
          onClick={() => router.push("/onboarding")}
        >
          Start in the browser
        </Button>
      </div>

      <p className="text-center text-base text-ink-muted">
        Installing puts LearnTogether on the home screen and lets it work
        without any internet connection.
      </p>
    </Screen>
  );
}
