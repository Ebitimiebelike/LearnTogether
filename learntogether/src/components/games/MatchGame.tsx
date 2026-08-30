"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { FeedbackBanner } from "@/components/learning/FeedbackBanner";
import { Celebration } from "@/components/rewards/Celebration";
import { useSession } from "@/features/learners/SessionProvider";
import { useAudio } from "@/hooks/useAudio";
import { buildMatchRound } from "@/features/practice/questions";
import { cn } from "@/lib/utils/cn";
import type { Badge, LearningItem } from "@/types";

export interface MatchGameProps {
  pool: LearningItem[];
  /** How many pairs are on screen at once. Three fits a phone comfortably. */
  size?: number;
  title: string;
}

/**
 * Tap-to-select matching.
 *
 * Drag-and-drop is deliberately avoided: holding a drag across a screen is hard
 * with limited fine motor control, and a slip cancels the whole gesture. Here
 * the learner taps a character, then taps its picture — two independent taps,
 * each with its own large target, either of which can be repeated freely.
 */
export function MatchGame({ pool, size = 3, title }: MatchGameProps) {
  const audio = useAudio();
  const { recordActivity } = useSession();

  // The board is generated once and held, so it cannot reshuffle mid-round.
  const [{ left, right }, setBoard] = useState(() => buildMatchRound(pool, size, Math.random));

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [matched, setMatched] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<{ tone: "success" | "encouraging"; message: string } | null>(null);
  const [starsAwarded, setStarsAwarded] = useState(0);
  const [newBadges, setNewBadges] = useState<Badge[]>([]);

  const complete = matched.length === left.length;

  useEffect(() => {
    if (complete) audio.playSuccess();
  }, [complete, audio]);

  const label = (item: LearningItem) =>
    item.category === "number" ? item.writtenWord ?? item.value : item.value;

  const selectCharacter = (item: LearningItem) => {
    if (matched.includes(item.id)) return;
    setSelectedId(item.id);
    setFeedback(null);
    void audio.speakItem(item);
  };

  const selectPicture = async (item: LearningItem) => {
    if (matched.includes(item.id)) return;

    if (!selectedId) {
      // Tapping a picture first is fine: say what it is and wait.
      void audio.speakInstruction(
        item.category === "number"
          ? `${label(item)}.`
          : `${item.word}. ${item.value} for ${item.word}.`,
      );
      setFeedback({ tone: "encouraging", message: "Now tap the matching one on the left." });
      return;
    }

    if (selectedId === item.id) {
      setMatched((current) => [...current, item.id]);
      setSelectedId(null);
      audio.playSuccess();
      void audio.speakInstruction(
        item.category === "number"
          ? `Yes! ${label(item)}.`
          : `Yes! ${item.value} for ${item.word}.`,
      );
      setFeedback({ tone: "success", message: "That matches!" });

      const { starsAwarded: stars, newBadges: badges } = await recordActivity({
        kind: "match",
        itemId: item.id,
        correct: true,
      });
      setStarsAwarded((current) => current + stars);
      if (badges.length > 0) setNewBadges(badges);
      return;
    }

    // Wrong pairing: encourage, keep the selection, let them try again.
    audio.playTryAgain();
    setFeedback({ tone: "encouraging", message: "Good try. Try another one." });
  };

  const nextRound = () => {
    setMatched([]);
    setSelectedId(null);
    setFeedback(null);
    setStarsAwarded(0);
    setNewBadges([]);
    setBoard(buildMatchRound(pool, size, Math.random));
  };

  if (complete) {
    return (
      <div className="flex flex-col gap-5 px-5 pb-8">
        <Celebration
          show
          message="You matched them all!"
          starsAwarded={starsAwarded}
          newBadges={newBadges}
        />
        <Button size="lg" icon="retry" fullWidth onClick={nextRound}>
          Play again
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 px-5 pb-8">
      <p className="rounded-card bg-surface px-5 py-4 text-center text-xl font-bold shadow-card">
        {title}
      </p>

      <div className="mx-auto grid w-full grid-cols-2 gap-4 landscape:max-w-3xl">
        <ul className="flex flex-col gap-3">
          {left.map((item) => {
            const isMatched = matched.includes(item.id);
            return (
              <li key={`left-${item.id}`}>
                <button
                  type="button"
                  onClick={() => selectCharacter(item)}
                  disabled={isMatched}
                  aria-pressed={selectedId === item.id}
                  aria-label={label(item)}
                  className={cn(
                    "flex min-h-[92px] w-full items-center justify-center rounded-card border-4 text-5xl font-extrabold shadow-card transition-transform duration-150 active:scale-95",
                    isMatched
                      ? "border-success bg-success-soft opacity-70"
                      : selectedId === item.id
                        ? "border-primary bg-primary-soft"
                        : "border-border-subtle bg-surface",
                  )}
                >
                  {item.displayValue}
                </button>
              </li>
            );
          })}
        </ul>

        <ul className="flex flex-col gap-3">
          {right.map((item) => {
            const isMatched = matched.includes(item.id);
            return (
              <li key={`right-${item.id}`}>
                <button
                  type="button"
                  onClick={() => selectPicture(item)}
                  disabled={isMatched}
                  aria-label={
                    item.category === "number"
                      ? `${item.value} objects`
                      : (item.word ?? item.value)
                  }
                  className={cn(
                    "flex min-h-[92px] w-full flex-col items-center justify-center gap-1 rounded-card border-4 shadow-card transition-transform duration-150 active:scale-95",
                    isMatched
                      ? "border-success bg-success-soft opacity-70"
                      : "border-border-subtle bg-surface",
                  )}
                >
                  <span aria-hidden="true" className="text-4xl leading-none">
                    {item.category === "number"
                      ? // Numbers match to a count of objects, not a word. The
                        // games screen keeps the pool small enough to count.
                        item.emoji.repeat(Number(item.value))
                      : item.emoji}
                  </span>
                  {item.category === "letter" && (
                    <span className="text-base font-semibold">{item.word}</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {feedback && <FeedbackBanner tone={feedback.tone} message={feedback.message} />}
    </div>
  );
}
