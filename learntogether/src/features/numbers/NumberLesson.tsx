"use client";

import { useRouter } from "next/navigation";
import { NUMBERS } from "@/data/numbers";
import { AudioButton } from "@/components/learning/AudioButton";
import { QuantityDisplay } from "@/components/learning/QuantityDisplay";
import { Button, ButtonLink } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { useAudio } from "@/hooks/useAudio";
import { useLessonVisit } from "@/hooks/useLessonVisit";
import type { LearningItem } from "@/types";

export interface NumberLessonProps {
  item: LearningItem;
}

/**
 * A single number lesson: the digit, its written word, and that many objects to
 * count. As with letters, tapping the big number itself says it aloud.
 */
export function NumberLesson({ item }: NumberLessonProps) {
  const router = useRouter();
  const audio = useAudio();
  useLessonVisit(item.id);

  const value = Number(item.value);
  const next = NUMBERS[value + 1];
  const previous = NUMBERS[value - 1];

  const say = () =>
    audio.speakNumber(item.writtenWord ?? item.value, item.audio);

  return (
    <>
      <PageHeader
        title={`Number ${item.displayValue}`}
        subtitle={`${value + 1} of ${NUMBERS.length}`}
        backHref="/learn/numbers"
      />

      {/* Landscape puts the number beside the things to count. */}
      <div className="flex flex-col gap-5 px-5 pb-8 landscape:flex-row landscape:gap-6">
        <button
          type="button"
          onClick={say}
          // Distinct from the speaker button below, so the two controls can be
          // told apart by name.
          aria-label={`Number ${item.displayValue}. Tap to hear it.`}
          className="flex flex-col items-center justify-center gap-1 rounded-card bg-surface py-6 shadow-card transition-transform duration-150 active:scale-[0.98] landscape:flex-1"
        >
          <span className="text-[clamp(4rem,22vmin,9rem)] font-extrabold leading-none">
            {item.displayValue}
          </span>
          <span className="text-4xl font-bold text-ink-muted">
            {item.writtenWord}
          </span>
        </button>

        <div className="flex min-w-0 flex-col gap-5 landscape:flex-1">
          <QuantityDisplay item={item} />

          <AudioButton
            onPlay={say}
            label={`Say ${item.writtenWord}`}
            className="w-full"
          >
            Say {item.writtenWord}
          </AudioButton>

          <ButtonLink
            href={`/trace/numbers/${item.value}`}
            variant="secondary"
            size="lg"
            icon="trace"
            fullWidth
          >
            Trace {item.displayValue}
          </ButtonLink>

          <div className="flex gap-3">
            {previous && (
              <Button
                size="lg"
                variant="secondary"
                icon="back"
                className="flex-1"
                onClick={() => router.push(`/learn/numbers/${previous.value}`)}
              >
                {previous.displayValue}
              </Button>
            )}
            <Button
              size="lg"
              icon="next"
              iconAfter
              className="flex-[2]"
              onClick={() =>
                router.push(
                  next ? `/learn/numbers/${next.value}` : "/learn/numbers",
                )
              }
            >
              {next ? `Next: ${next.displayValue}` : "Finish"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
