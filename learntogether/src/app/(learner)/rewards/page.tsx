"use client";

import { BADGES } from "@/data/badges";
import { RewardCard } from "@/components/rewards/RewardCard";
import { StarCount } from "@/components/rewards/StarCount";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useSession } from "@/features/learners/SessionProvider";
import { nextBadge, progressToNextBadge } from "@/features/rewards/rewards";

/**
 * Rewards.
 *
 * Stars and badges only, measured against the learner's own past. There is no
 * leaderboard and nothing to compare against anyone else.
 */
export default function RewardsPage() {
  const { rewards } = useSession();
  const upcoming = nextBadge(rewards.stars);

  return (
    <>
      <PageHeader title="Rewards" backHref="/progress" />

      <div className="flex flex-col gap-5 px-5 pb-8">
        <Card className="flex flex-col items-center gap-4 text-center">
          <span aria-hidden="true" className="text-6xl animate-float">
            ⭐
          </span>
          <StarCount stars={rewards.stars} size="lg" />
          <p className="text-lg text-ink-muted">
            {rewards.streak > 0
              ? `${rewards.streak} ${rewards.streak === 1 ? "day" : "days"} in a row`
              : "Every activity earns a star."}
          </p>

          {upcoming && (
            <ProgressBar
              className="mt-2"
              tone="reward"
              label={`Next badge: ${upcoming.label}`}
              value={progressToNextBadge(rewards.stars)}
              valueLabel={`${rewards.stars} of ${upcoming.requiredStars} stars`}
            />
          )}
        </Card>

        <h2 className="text-xl font-extrabold">Badges</h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {BADGES.map((badge) => (
            <RewardCard
              key={badge.id}
              badge={badge}
              unlocked={rewards.badges.includes(badge.id)}
            />
          ))}
        </ul>
      </div>
    </>
  );
}
