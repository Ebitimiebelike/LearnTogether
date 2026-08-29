"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getLetter } from "@/data/alphabet";
import { AudioButton } from "@/components/learning/AudioButton";
import { ChoiceButton, type ChoiceState } from "@/components/learning/ChoiceButton";
import { FeedbackBanner } from "@/components/learning/FeedbackBanner";
import { Illustration } from "@/components/learning/Illustration";
import { Celebration } from "@/components/rewards/Celebration";
import { Button } from "@/components/ui/Button";
import { Screen } from "@/components/ui/Screen";
import { useSession } from "@/features/learners/SessionProvider";
import { useAudio } from "@/hooks/useAudio";
import type { Badge } from "@/types";

/**
 * The very first lesson, run once straight after setup.
 *
 * A deliberately tiny loop — see A, hear A, see Apple, find A, celebrate — so
 * the learner reaches a success and their first star within about a minute of
 * opening the app, and has already seen every interaction the rest of the app
 * uses.
 */

const LETTER_A = getLetter("A")!;
const LETTER_B = getLetter("B")!;

type Stage = "show" | "word" | "find" | "done";

export function FirstLesson() {
  const router = useRouter();
  const audio = useAudio();
  const { recordActivity, updateSettings, learner } = useSession();

  const [stage, setStage] = useState<Stage>("show");
  const [choiceStates, setChoiceStates] = useState<Record<string, ChoiceState>>({});
  const [feedback, setFeedback] = useState<string | null>(null);
  const [starsAwarded, setStarsAwarded] = useState(0);
  const [newBadges, setNewBadges] = useState<Badge[]>([]);

  // Say the letter as soon as it appears, and speak the instruction at "find".
  useEffect(() => {
    if (stage === "show") void audio.speakLetter(LETTER_A.value, LETTER_A.audio);
    if (stage === "word") void audio.speakInstruction(`A is for ${LETTER_A.word}.`);
    if (stage === "find") void audio.speakInstruction("Find A.");
  }, [stage, audio]);

  const handleChoice = async (isCorrect: boolean, id: string) => {
    if (!isCorrect) {
      // Never a failure: encourage and repeat the instruction.
      setChoiceStates((current) => ({ ...current, [id]: "tryAgain" }));
      audio.playTryAgain();
      setFeedback("Good try. Find A.");
      setTimeout(() => void audio.speakInstruction("Good try. Find A."), 500);
      return;
    }

    setChoiceStates((current) => ({ ...current, [id]: "correct" }));
    audio.playSuccess();
    void audio.speakInstruction("Great job! A.");
    setFeedback(null);

    // The lesson itself, then the correct identification: two events, so the
    // first star is earned the same way every later star is.
    await recordActivity({ kind: "lesson", itemId: LETTER_A.id });
    const { starsAwarded: stars, newBadges: badges } = await recordActivity({
      kind: "identify",
      itemId: LETTER_A.id,
      correct: true,
    });
    setStarsAwarded(stars + 1);
    setNewBadges(badges);

    // Onboarding is only complete once the learner has actually finished this.
    await updateSettings({ onboardingComplete: true });
    setStage("done");
  };

  if (stage === "done") {
    return (
      <Screen center className="gap-6 px-6 py-8">
        <Celebration
          show
          message={`Well done${learner ? `, ${learner.name}` : ""}!`}
          starsAwarded={starsAwarded}
          newBadges={newBadges}
        />
        <p className="text-center text-xl text-ink-muted">
          That is how every activity works. Nothing is timed, and you can try as
          many times as you like.
        </p>
        <Button size="lg" icon="home" fullWidth onClick={() => {
            audio.stopMusic();
            router.replace("/home");
          }}>
          Go to Home
        </Button>
      </Screen>
    );
  }

  return (
    <Screen className="justify-between gap-6 px-6 py-8">
      <p className="text-center text-lg font-semibold text-ink-muted">
        Your first lesson
      </p>

      {stage === "show" && (
        <div className="flex flex-col items-center gap-6">
          <p className="text-[10rem] font-extrabold leading-none animate-pop">
            {LETTER_A.value}
          </p>
          <AudioButton
            onPlay={() => audio.speakLetter(LETTER_A.value, LETTER_A.audio)}
            label="Say the letter A"
          >
            Say it again
          </AudioButton>
        </div>
      )}

      {stage === "word" && (
        <div className="flex flex-col items-center gap-5">
          <p className="text-8xl font-extrabold leading-none">{LETTER_A.value}</p>
          <Illustration item={LETTER_A} size={112} className="p-6" />
          <p className="text-3xl font-extrabold">{LETTER_A.word}</p>
          <AudioButton
            onPlay={() => audio.speakInstruction(`A is for ${LETTER_A.word}.`)}
            label={`Say A is for ${LETTER_A.word}`}
          >
            Say it again
          </AudioButton>
        </div>
      )}

      {stage === "find" && (
        <div className="flex flex-col items-center gap-6">
          <p className="text-3xl font-extrabold">Find A.</p>
          <ul className="grid w-full grid-cols-2 gap-4">
            {[LETTER_A, LETTER_B].map((item) => (
              <li key={item.id}>
                <ChoiceButton
                  item={item}
                  state={choiceStates[item.id] ?? "idle"}
                  onSelect={() => handleChoice(item.id === LETTER_A.id, item.id)}
                />
              </li>
            ))}
          </ul>
          {feedback && <FeedbackBanner tone="encouraging" message={feedback} />}
        </div>
      )}

      {stage !== "find" && (
        <Button
          size="lg"
          icon="next"
          iconAfter
          fullWidth
          onClick={() => setStage(stage === "show" ? "word" : "find")}
        >
          Next
        </Button>
      )}
    </Screen>
  );
}
