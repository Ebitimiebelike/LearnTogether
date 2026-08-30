"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Screen } from "@/components/ui/Screen";
import { cn } from "@/lib/utils/cn";

/**
 * Onboarding: three screens, no account, no permissions requested.
 *
 * The content is data so the sequence can be reordered or translated without
 * touching the component.
 */
interface OnboardingStep {
  emoji: string;
  title: string;
  body: string;
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    emoji: "🌱",
    title: "Learn at your own pace.",
    body: "LearnTogether uses pictures, sounds and simple activities. Nothing is timed, and you can repeat anything as often as you like.",
  },
  {
    emoji: "📶",
    title: "Learn anywhere.",
    body: "Everything works without Wi-Fi or mobile data once the app has loaded. There are no ads, ever.",
  },
  {
    emoji: "⭐",
    title: "Celebrate every step.",
    body: "Every activity earns stars and badges. Progress is saved on this device, and every answer gets kind, encouraging feedback.",
  },
];

export function OnboardingFlow() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const current = ONBOARDING_STEPS[step];
  const isLast = step === ONBOARDING_STEPS.length - 1;

  return (
    <Screen className="justify-between px-6 py-8">
      <div className="flex justify-end">
        <Button variant="quiet" onClick={() => router.push("/setup")}>
          Skip
        </Button>
      </div>

      {/* Landscape sets the emoji beside the words; stacked, they do not fit
          the short height of a landscape screen. */}
      <div className="flex flex-col items-center gap-6 text-center landscape:flex-row landscape:gap-10 landscape:text-left">
        <span aria-hidden="true" className="text-8xl landscape:shrink-0">
          {current.emoji}
        </span>
        <div className="flex flex-col items-center gap-6 landscape:items-start">
          {/* Keyed so each step is announced as new content, not an edit. */}
          <h1
            key={`title-${step}`}
            className="text-3xl font-extrabold animate-rise"
          >
            {current.title}
          </h1>
          <p
            key={`body-${step}`}
            className="max-w-md text-xl text-ink-muted animate-rise"
          >
            {current.body}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <ol
          className="flex justify-center gap-3"
          aria-label="Onboarding progress"
        >
          {ONBOARDING_STEPS.map((item, index) => (
            <li
              key={item.title}
              aria-current={index === step ? "step" : undefined}
              className={cn(
                "h-3 rounded-full transition-all duration-300",
                index === step ? "w-10 bg-primary" : "w-3 bg-border-subtle",
              )}
            >
              <span className="sr-only">
                Step {index + 1} of {ONBOARDING_STEPS.length}
              </span>
            </li>
          ))}
        </ol>

        <div className="flex gap-3">
          {step > 0 && (
            <Button
              size="lg"
              variant="secondary"
              icon="back"
              onClick={() => setStep(step - 1)}
              className="flex-1"
            >
              Back
            </Button>
          )}
          <Button
            size="lg"
            icon="next"
            iconAfter
            className="flex-[2]"
            onClick={() => (isLast ? router.push("/setup") : setStep(step + 1))}
          >
            {isLast ? "Get started" : "Next"}
          </Button>
        </div>
      </div>
    </Screen>
  );
}
