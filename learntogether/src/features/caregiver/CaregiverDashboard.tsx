"use client";

import { useMemo, useState } from "react";
import { ALPHABET } from "@/data/alphabet";
import { NUMBERS } from "@/data/numbers";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { useProgressList, useSession } from "@/features/learners/SessionProvider";
import { buildCaregiverStats } from "./stats";
import { formatDuration, formatRelativeDay, formatTime } from "@/lib/utils/date";
import type { LearningItem } from "@/types";

/**
 * The caregiver dashboard.
 *
 * Read-only apart from the reset, and deliberately plain: counts of what has
 * happened, and which characters are worth revisiting. No trend lines, no
 * scores and no advanced analytics — this is meant to answer "what should we
 * work on next?" in a few seconds.
 */

function NeedsPractice({ items, empty }: { items: LearningItem[]; empty: string }) {
  if (items.length === 0) {
    return <p className="text-base text-ink-muted">{empty}</p>;
  }
  return (
    <ul className="flex flex-wrap gap-2">
      {items.map((item) => (
        <li
          key={item.id}
          className="flex min-h-[52px] min-w-[52px] items-center justify-center rounded-image bg-gentle-soft px-4 text-2xl font-extrabold"
        >
          {item.displayValue}
        </li>
      ))}
    </ul>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-image bg-surface-sunken px-3 py-4 text-center">
      <dt className="text-base text-ink-muted">{label}</dt>
      <dd className="text-3xl font-extrabold">{value}</dd>
    </div>
  );
}

export function CaregiverDashboard() {
  const { learner, activity, rewards, resetProgress } = useSession();
  const progress = useProgressList();
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [resetting, setResetting] = useState(false);

  const stats = useMemo(
    () => buildCaregiverStats(activity, progress, ALPHABET, NUMBERS),
    [activity, progress],
  );

  const handleReset = async () => {
    setResetting(true);
    await resetProgress();
    setResetting(false);
    setConfirmingReset(false);
  };

  return (
    <>
      <PageHeader
        title="Caregiver area"
        subtitle={learner ? `${learner.name}, age ${learner.age}` : undefined}
        backHref="/home"
      />

      <div className="flex flex-col gap-5 px-5 pb-10">
        <Card>
          <h2 className="mb-3 text-xl font-extrabold">Today</h2>
          <dl className="grid grid-cols-3 gap-3">
            <Stat label="Activities" value={stats.practiceCompletedToday} />
            <Stat label="Stars" value={stats.starsToday} />
            <Stat label="Streak" value={rewards.streak} />
          </dl>
        </Card>

        <Card>
          <h2 className="mb-3 text-xl font-extrabold">Overall</h2>
          <dl className="grid grid-cols-2 gap-3">
            <Stat label="Letters practised" value={`${stats.lettersPracticed} / 26`} />
            <Stat label="Numbers practised" value={`${stats.numbersPracticed} / 21`} />
            <Stat label="Letter traces" value={stats.letterTraces} />
            <Stat label="Number traces" value={stats.numberTraces} />
          </dl>
          <p className="mt-4 text-base text-ink-muted">
            Total learning time: {formatDuration(stats.totalLearningTimeMs)}
          </p>
        </Card>

        <Card>
          <h2 className="mb-3 text-xl font-extrabold">Needs more practice</h2>
          <div className="flex flex-col gap-4">
            <div>
              <h3 className="mb-2 text-lg font-bold">Letters</h3>
              <NeedsPractice
                items={stats.lettersNeedingPractice}
                empty="Nothing stands out yet."
              />
            </div>
            <div>
              <h3 className="mb-2 text-lg font-bold">Numbers</h3>
              <NeedsPractice
                items={stats.numbersNeedingPractice}
                empty="Nothing stands out yet."
              />
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="mb-3 text-xl font-extrabold">Recent sessions</h2>
          {stats.recentSessions.length === 0 ? (
            <p className="text-base text-ink-muted">No sessions recorded yet.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {stats.recentSessions.map((session) => (
                <li
                  key={session.startedAt}
                  className="flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-image bg-surface-sunken px-4 py-3"
                >
                  <span className="font-bold">
                    {formatRelativeDay(session.startedAt)}, {formatTime(session.startedAt)}
                  </span>
                  <span className="text-base text-ink-muted">
                    {session.activityCount}{" "}
                    {session.activityCount === 1 ? "activity" : "activities"} ·{" "}
                    {formatDuration(session.durationMs)} · {session.starsEarned} stars
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <ButtonLink href="/settings" variant="secondary" size="lg" icon="settings" fullWidth>
          Settings
        </ButtonLink>

        <Card tone="sunken">
          <h2 className="text-xl font-extrabold">Reset progress</h2>
          <p className="mt-2 text-base text-ink-muted">
            Clears all stars, badges and practice history for {learner?.name}. The
            learner profile itself is kept. This cannot be undone.
          </p>
          <Button
            variant="secondary"
            icon="reset"
            className="mt-4"
            onClick={() => setConfirmingReset(true)}
          >
            Reset progress
          </Button>
        </Card>
      </div>

      <Modal
        open={confirmingReset}
        title="Reset all progress?"
        onClose={() => setConfirmingReset(false)}
        footer={
          <>
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setConfirmingReset(false)}
            >
              Cancel
            </Button>
            <Button className="flex-1" disabled={resetting} onClick={handleReset}>
              {resetting ? "Resetting…" : "Yes, reset"}
            </Button>
          </>
        }
      >
        Stars, badges, streak and every practice record for {learner?.name} will be
        deleted from this device. This cannot be undone.
      </Modal>
    </>
  );
}
