"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { AudioButton } from "@/components/learning/AudioButton";
import { ChoiceButton, type ChoiceState } from "@/components/learning/ChoiceButton";
import { FeedbackBanner } from "@/components/learning/FeedbackBanner";
import { Celebration } from "@/components/rewards/Celebration";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useSession, useProgressList } from "@/features/learners/SessionProvider";
import { useAudio } from "@/hooks/useAudio";
import { buildSession, DEFAULT_CHOICE_COUNT, type PracticeMode } from "./questions";
import type { Badge, LearningItem } from "@/types";

export interface PracticeActivityProps {
  /** The items questions are drawn from — the alphabet, or the numbers. */
  pool: LearningItem[];
  /**
   * "identify" shows the prompt as text and speech ("Find A.").
   * "listen" plays the target and shows no text clue.
   */
  mode: PracticeMode;
  /** How many questions make a round. */
  length?: number;
  choiceCount?: number;
  /** Where "Done" goes at the end of the round. */
  doneHref: string;
}

/**
 * The shared body of the identification and listening exercises.
 *
 * The rules that matter, and are enforced here rather than per screen:
 *  - There is no timer, and no penalty for thinking.
 *  - A wrong tap is never an error: it speaks what was tapped, says "Good try",
 *    repeats the prompt and leaves every choice enabled.
 *  - Retries are unlimited; the learner moves on only when they get it.
 *  - Only the first attempt counts towards progress, so repeated tries never
 *    push an item's success rate down again and again.
 */
export function PracticeActivity({
  pool,
  mode,
  length = 5,
  choiceCount = DEFAULT_CHOICE_COUNT,
  doneHref,
}: PracticeActivityProps) {
  const router = useRouter();
  const audio = useAudio();
  const { recordActivity } = useSession();
  const progressList = useProgressList();

  // Held in state, not derived: a round is generated once and must stay put.
  // Rebuilding it as progress changes would reshuffle the questions under the
  // learner mid-round. "Play again" builds a fresh one from current progress.
  const [questions, setQuestions] = useState(() =>
    buildSession(pool, progressList, length, choiceCount, Math.random, mode),
  );

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<Record<string, ChoiceState>>({});
  const [feedback, setFeedback] = useState<{ tone: "success" | "encouraging"; message: string } | null>(null);
  const [firstTry, setFirstTry] = useState(true);
  const [starsAwarded, setStarsAwarded] = useState(0);
  const [newBadges, setNewBadges] = useState<Badge[]>([]);
  const [finished, setFinished] = useState(false);

  const question = questions[index];

  const speakPrompt = useCallback(() => {
    if (!question) return;
    if (mode === "listen") {
      void audio.speakItem(question.target);
    } else {
      void audio.speakInstruction(question.prompt);
    }
  }, [audio, mode, question]);

  // Speak the prompt whenever a new question appears.
  useEffect(() => {
    speakPrompt();
  }, [speakPrompt]);

  if (!question) return null;

  const handleSelect = async (item: LearningItem, isCorrect: boolean) => {
    if (isCorrect) {
      setSelected((current) => ({ ...current, [item.id]: "correct" }));
      audio.playSuccess();
      const spoken =
        item.category === "number" ? item.writtenWord ?? item.value : item.value;
      void audio.speakInstruction(`Great job! ${spoken}.`);
      setFeedback({ tone: "success", message: "Great job!" });

      // Only the first attempt is scored, so retries never count against them.
      const { starsAwarded: stars, newBadges: badges } = await recordActivity({
        kind: mode === "listen" ? "listen" : "identify",
        itemId: question.target.id,
        correct: firstTry,
      });
      setStarsAwarded((current) => current + stars);
      if (badges.length > 0) setNewBadges(badges);
      return;
    }

    // Never punish: say what they tapped, encourage, repeat the prompt.
    setSelected((current) => ({ ...current, [item.id]: "tryAgain" }));
    setFirstTry(false);
    audio.playTryAgain();
    setFeedback({
      tone: "encouraging",
      message: mode === "listen" ? "Good try. Listen again." : `Good try. ${question.prompt}`,
    });
    // Let the "try again" tone finish before repeating the prompt.
    setTimeout(speakPrompt, 700);
  };

  const answered = Object.values(selected).includes("correct");

  const goNext = () => {
    // The hook is a reward, not something to sit through: moving on ends it.
    audio.stopMusic();
    setSelected({});
    setFeedback(null);
    setFirstTry(true);
    if (index + 1 < questions.length) setIndex(index + 1);
    else setFinished(true);
  };

  const playAgain = () => {
    setIndex(0);
    setSelected({});
    setFeedback(null);
    setFirstTry(true);
    setFinished(false);
    setStarsAwarded(0);
    setNewBadges([]);
    setQuestions(buildSession(pool, progressList, length, choiceCount, Math.random, mode));
  };

  if (finished) {
    return (
      <div className="flex flex-col gap-5 px-5 pb-8">
        <Celebration
          show
          message="You finished!"
          starsAwarded={starsAwarded}
          newBadges={newBadges}
        />
        <Button size="lg" icon="retry" fullWidth onClick={playAgain}>
          Play again
        </Button>
        <Button size="lg" variant="secondary" fullWidth onClick={() => router.push(doneHref)}>
          Done
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 px-5 pb-8">
      <ProgressBar
        value={(index + (answered ? 1 : 0)) / questions.length}
        label="This round"
        valueLabel={`${index + 1} of ${questions.length}`}
      />

      <div className="flex flex-col items-center gap-4 rounded-card bg-surface p-6 shadow-card">
        {mode === "identify" ? (
          <p className="text-center text-3xl font-extrabold">{question.prompt}</p>
        ) : (
          <p className="text-center text-2xl font-bold text-ink-muted">
            Listen, then choose.
          </p>
        )}
        <AudioButton
          onPlay={speakPrompt}
          label={mode === "listen" ? "Play the sound again" : "Say the question again"}
        >
          {mode === "listen" ? "Play sound" : "Say it again"}
        </AudioButton>
      </div>

      {/* Capped in landscape: a tile as tall as the screen is harder to aim at,
          not easier, and would push the feedback banner out of view. */}
      <ul className="mx-auto grid w-full grid-cols-3 gap-3 max-[420px]:grid-cols-2 landscape:max-w-[min(100%,58vh)]">
        {question.choices.map((choice) => (
          <li key={choice.item.id}>
            <ChoiceButton
              item={choice.item}
              state={selected[choice.item.id] ?? "idle"}
              // A correct answer locks the round; wrong taps stay available.
              disabled={answered}
              onSelect={() => handleSelect(choice.item, choice.isCorrect)}
            />
          </li>
        ))}
      </ul>

      {feedback && <FeedbackBanner tone={feedback.tone} message={feedback.message} />}

      {answered && (
        <Button size="lg" icon="next" iconAfter fullWidth onClick={goNext}>
          {index + 1 < questions.length ? "Next" : "Finish"}
        </Button>
      )}
    </div>
  );
}
