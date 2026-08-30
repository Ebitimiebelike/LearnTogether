"use client";

import { useRouter } from "next/navigation";
import { ALPHABET } from "@/data/alphabet";
import { AudioButton } from "@/components/learning/AudioButton";
import { Illustration } from "@/components/learning/Illustration";
import { Button, ButtonLink } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { useAudio } from "@/hooks/useAudio";
import { useLessonVisit } from "@/hooks/useLessonVisit";
import type { LearningItem } from "@/types";

export interface LetterLessonProps {
  item: LearningItem;
}

/**
 * A single letter lesson.
 *
 * One idea per screen: the letter, how it sounds, and one familiar word with a
 * picture. Both the big letter itself and the speaker button pronounce it, so
 * the most obvious thing to tap is also the right one.
 */
export function LetterLesson({ item }: LetterLessonProps) {
  const router = useRouter();
  const audio = useAudio();
  useLessonVisit(item.id);

  const index = ALPHABET.findIndex((entry) => entry.id === item.id);
  const next = ALPHABET[index + 1];
  const previous = ALPHABET[index - 1];

  const say = () => audio.speakLetter(item.value, item.audio);

  return (
    <>
      <PageHeader
        title={`Letter ${item.value}`}
        subtitle={`${index + 1} of ${ALPHABET.length}`}
        backHref="/learn/alphabet"
      />

      {/* Landscape puts the letter beside everything else, rather than making
          the learner scroll past it to reach the buttons. */}
      <div className="flex flex-col gap-5 px-5 pb-8 landscape:flex-row landscape:gap-6">
        {/* Tapping the letter says it — the largest and most obvious target. */}
        <button
          type="button"
          onClick={say}
          // Distinct from the speaker button below: two controls that do the
          // same thing still need different names to be told apart by voice.
          aria-label={`Letter ${item.value}, big and small. Tap to hear it.`}
          className="flex flex-col items-center justify-center rounded-card bg-surface py-6 shadow-card transition-transform duration-150 active:scale-[0.98] landscape:flex-1"
        >
          <span className="text-[clamp(4rem,22vmin,9rem)] font-extrabold leading-none">
            {item.value}
          </span>
          <span className="text-[clamp(2.5rem,13vmin,5rem)] font-bold leading-none text-ink-muted">
            {item.lowercase}
          </span>
        </button>

        <div className="flex min-w-0 flex-col gap-5 landscape:flex-1">
          <div className="flex items-center gap-5 rounded-card bg-surface p-5 shadow-card">
            <Illustration item={item} size={84} className="size-28 shrink-0" />
            <div className="min-w-0">
              <p className="text-base text-ink-muted">{item.value} is for</p>
              <p className="truncate text-4xl font-extrabold">{item.word}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <AudioButton
              onPlay={say}
              label={`Say the letter ${item.value}`}
              className="flex-1"
            >
              Say {item.value}
            </AudioButton>
            <AudioButton
              onPlay={() => audio.speakSoundHint(item)}
              label={`Hear the sound ${item.value} makes`}
              tone="surface"
              className="flex-1"
            >
              Listen to the sound
            </AudioButton>
          </div>

          <ButtonLink
            href={`/trace/letters/${item.lowercase}`}
            variant="secondary"
            size="lg"
            icon="trace"
            fullWidth
          >
            Trace {item.value}
          </ButtonLink>

          <div className="flex gap-3">
            {previous && (
              <Button
                size="lg"
                variant="secondary"
                icon="back"
                className="flex-1"
                onClick={() =>
                  router.push(`/learn/alphabet/${previous.lowercase}`)
                }
              >
                {previous.value}
              </Button>
            )}
            <Button
              size="lg"
              icon="next"
              iconAfter
              className="flex-[2]"
              onClick={() =>
                router.push(
                  next
                    ? `/learn/alphabet/${next.lowercase}`
                    : "/learn/alphabet",
                )
              }
            >
              {next ? `Next: ${next.value}` : "Finish"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
