"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ALPHABET } from "@/data/alphabet";
import { NUMBERS } from "@/data/numbers";
import { AvatarCard } from "@/components/rewards/AvatarCard";
import { StarCount } from "@/components/rewards/StarCount";
import { CategoryCard } from "@/components/learning/CategoryCard";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { IconLink } from "@/components/ui/IconButton";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useProgressList, useSession } from "@/features/learners/SessionProvider";
import { nextActivity } from "@/features/progress/continue";
import { completionRatio, summarise } from "@/features/progress/mastery";
import { startOfDay } from "@/lib/utils/date";

/**
 * Home.
 *
 * The two things that matter most — who is learning, and what to do next — are
 * at the top and are the largest targets on the screen. Everything else is a
 * grid of equally sized cards, so a learner reaches any activity in at most
 * three taps from here.
 */
export default function HomePage() {
  const { learner, rewards, activity } = useSession();
  const progress = useProgressList();

  const suggestion = useMemo(
    () => nextActivity(ALPHABET, NUMBERS, progress),
    [progress],
  );

  const letterSummary = useMemo(() => summarise(ALPHABET, progress), [progress]);
  const numberSummary = useMemo(() => summarise(NUMBERS, progress), [progress]);

  const todaysActivities = useMemo(() => {
    const dayStart = startOfDay();
    return activity.filter((event) => event.timestamp >= dayStart);
  }, [activity]);

  const starsToday = todaysActivities.reduce(
    (total, event) => total + event.starsAwarded,
    0,
  );

  if (!learner) return null;

  return (
    <div className="flex flex-col gap-5 px-5 pt-6">
      <header className="flex items-center gap-4">
        <AvatarCard avatarId={learner.avatar} size="md" />
        <div className="min-w-0 flex-1">
          <p className="text-base text-ink-muted">Hello</p>
          <h1 className="truncate text-3xl font-extrabold">{learner.name}</h1>
        </div>
        <IconLink href="/settings" icon="settings" label="Settings and caregiver area" />
      </header>

      {/* The single most important action, and the biggest target on screen. */}
      <Link
        href={suggestion.href}
        className="flex items-center gap-4 rounded-card bg-primary p-6 text-on-primary shadow-raised transition-transform duration-150 active:scale-[0.98]"
      >
        <span className="flex-1">
          <span className="block text-lg font-semibold opacity-90">
            Continue learning
          </span>
          <span className="block text-3xl font-extrabold">{suggestion.label}</span>
          <span className="block text-base opacity-90">{suggestion.reason}</span>
        </span>
        <span aria-hidden="true" className="text-6xl font-extrabold">
          {suggestion.item.displayValue}
        </span>
      </Link>

      <Card>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-xl font-extrabold">Today</h2>
          <StarCount stars={rewards.stars} />
        </div>
        <dl className="grid grid-cols-3 gap-3 text-center">
          <div className="rounded-image bg-surface-sunken px-2 py-3">
            <dt className="text-base text-ink-muted">Activities</dt>
            <dd className="text-2xl font-extrabold">{todaysActivities.length}</dd>
          </div>
          <div className="rounded-image bg-surface-sunken px-2 py-3">
            <dt className="text-base text-ink-muted">Stars today</dt>
            <dd className="text-2xl font-extrabold">{starsToday}</dd>
          </div>
          <div className="rounded-image bg-surface-sunken px-2 py-3">
            <dt className="text-base text-ink-muted">Day streak</dt>
            <dd className="text-2xl font-extrabold">{rewards.streak}</dd>
          </div>
        </dl>
        <div className="mt-4 flex flex-col gap-3">
          <ProgressBar
            label="Letters"
            value={completionRatio(letterSummary)}
            valueLabel={`${letterSummary.mastered} of ${letterSummary.total} mastered`}
          />
          <ProgressBar
            label="Numbers"
            value={completionRatio(numberSummary)}
            valueLabel={`${numberSummary.mastered} of ${numberSummary.total} mastered`}
            tone="success"
          />
        </div>
      </Card>

      <h2 className="mt-1 text-xl font-extrabold">What would you like to do?</h2>
      <div className="grid grid-cols-2 gap-4">
        <CategoryCard
          href="/learn/alphabet"
          title="Letters"
          description="A to Z"
          emoji="🔤"
          tone="primary"
        />
        <CategoryCard
          href="/learn/numbers"
          title="Numbers"
          description="0 to 20"
          emoji="🔢"
          tone="success"
        />
        <CategoryCard
          href="/trace"
          title="Trace"
          description="Write with your finger"
          emoji="✏️"
        />
        <CategoryCard
          href="/practice"
          title="Practice"
          description="Find and listen"
          emoji="🎯"
        />
        <CategoryCard href="/games" title="Games" description="Matching" emoji="🧩" />
        <CategoryCard
          href="/rewards"
          title="Rewards"
          description="Stars and badges"
          emoji="⭐"
          tone="reward"
        />
      </div>

      <Link
        href="/caregiver"
        className="mb-2 flex min-h-touch items-center gap-3 rounded-card bg-surface px-5 py-4 font-semibold shadow-card"
      >
        <Icon name="lock" size={26} className="text-ink-muted" />
        Caregiver area
        <Icon name="next" size={22} className="ml-auto text-ink-muted" />
      </Link>
    </div>
  );
}
