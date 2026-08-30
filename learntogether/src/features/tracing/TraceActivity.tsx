"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TracingCanvas } from "@/components/tracing/TracingCanvas";
import { Button } from "@/components/ui/Button";
import { AudioButton } from "@/components/learning/AudioButton";
import { FeedbackBanner } from "@/components/learning/FeedbackBanner";
import { Celebration } from "@/components/rewards/Celebration";
import { useSession } from "@/features/learners/SessionProvider";
import { useAudio } from "@/hooks/useAudio";
import type { TraceResult } from "@/features/tracing/coverage";
import type { Badge, LearningItem } from "@/types";

export interface TraceActivityProps {
  /** The lesson item this trace belongs to, so progress is recorded against it. */
  item: LearningItem;
  /** The character actually being traced — "A", "a" or "7". */
  character: string;
  strokes: string[];
  /** Where "Next" goes. Null on the last item, which offers "Finish" instead. */
  nextHref: string | null;
  /** Where "Finish" goes when there is no next item. */
  finishHref: string;
  /** Rendered above the canvas, e.g. the uppercase/lowercase switch. */
  toolbar?: React.ReactNode;
}

/**
 * The shared body of every tracing screen.
 *
 * Letters and numbers differ only in their stroke data and where "Next" points,
 * so both screens render this. There is no timer, no pass mark to clear, and
 * "Next" is always available: a learner can move on whenever they want to.
 */
export function TraceActivity({
  item,
  character,
  strokes,
  nextHref,
  finishHref,
  toolbar,
}: TraceActivityProps) {
  const router = useRouter();
  const audio = useAudio();
  const { recordActivity } = useSession();

  // Changing this remounts the canvas, which is how Clear and Try again work.
  const [attempt, setAttempt] = useState(0);
  const [feedback, setFeedback] = useState<TraceResult | null>(null);
  const [celebrating, setCelebrating] = useState(false);
  const [starsAwarded, setStarsAwarded] = useState(0);
  const [newBadges, setNewBadges] = useState<Badge[]>([]);
  const [recorded, setRecorded] = useState(false);

  const speak = () => audio.speakItem(item);

  const handleComplete = async (result: TraceResult) => {
    setFeedback(result);
    setCelebrating(true);
    audio.playSuccess();
    void audio.speakInstruction(result.message);

    // One star per character per visit, however many attempts it took.
    if (recorded) return;
    setRecorded(true);
    const { starsAwarded: stars, newBadges: badges } = await recordActivity({
      kind: "trace",
      itemId: item.id,
    });
    setStarsAwarded(stars);
    setNewBadges(badges);
  };

  const handleStrokeEnd = (result: TraceResult) => {
    // Only nudge when the trace is not yet good enough; success is handled above.
    if (!result.passed) setFeedback(result);
  };

  const reset = (replayAudio: boolean) => {
    setAttempt((current) => current + 1);
    setFeedback(null);
    setCelebrating(false);
    if (replayAudio) void speak();
  };

  return (
    /**
     * Portrait stacks; landscape puts the canvas beside its controls.
     *
     * In landscape, vertical space is the scarce resource and horizontal space
     * is plentiful — stacking would push the buttons below the fold. This is
     * keyed off orientation rather than a width breakpoint because a landscape
     * phone has the same problem as a landscape tablet.
     */
    <div className="flex flex-col gap-5 px-5 pb-8 landscape:flex-row landscape:items-start landscape:gap-6">
      <div className="flex min-w-0 flex-col gap-5 landscape:flex-1">
        {toolbar}

        <TracingCanvas
          key={`${character}-${attempt}`}
          strokes={strokes}
          character={character}
          onComplete={handleComplete}
          onStrokeEnd={handleStrokeEnd}
        />
      </div>

      <div className="flex min-w-0 flex-col gap-5 landscape:flex-1 landscape:pt-1">
        {celebrating ? (
          <Celebration
            show
            message={feedback?.message ?? `Great job tracing ${character}!`}
            starsAwarded={starsAwarded}
            newBadges={newBadges}
          />
        ) : (
          feedback && (
            <FeedbackBanner tone="encouraging" message={feedback.message} />
          )
        )}

        <div className="flex flex-wrap gap-3">
          <AudioButton
            onPlay={speak}
            label={`Say ${character}`}
            tone="surface"
            className="flex-1"
          >
            Listen
          </AudioButton>
          <Button
            variant="secondary"
            icon="close"
            onClick={() => reset(false)}
            className="flex-1"
          >
            Clear
          </Button>
          <Button
            variant="secondary"
            icon="retry"
            onClick={() => reset(true)}
            className="flex-1"
          >
            Try again
          </Button>
        </div>

        <Button
          size="lg"
          icon="next"
          iconAfter
          fullWidth
          onClick={() => {
            audio.stopMusic();
            router.push(nextHref ?? finishHref);
          }}
        >
          {nextHref ? "Next" : "Finish"}
        </Button>
      </div>
    </div>
  );
}
