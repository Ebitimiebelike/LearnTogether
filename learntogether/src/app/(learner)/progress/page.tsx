"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ALPHABET } from "@/data/alphabet";
import { NUMBERS } from "@/data/numbers";
import { StarCount } from "@/components/rewards/StarCount";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { PageHeader } from "@/components/ui/PageHeader";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useProgressList, useSession } from "@/features/learners/SessionProvider";
import { completionRatio, summarise, type CategorySummary } from "@/features/progress/mastery";
import { formatRelativeDay, formatTime } from "@/lib/utils/date";
import type { ActivityKind } from "@/types";

/**
 * The learner-facing progress screen.
 *
 * Visual and encouraging: counts and bars rather than percentages and tables,
 * and no framing that could read as falling behind.
 */

const ACTIVITY_LABEL: Record<ActivityKind, string> = {
  lesson: "Looked at",
  trace: "Traced",
  identify: "Found",
  listen: "Listened for",
  match: "Matched",
};

const ALL_ITEMS = [...ALPHABET, ...NUMBERS];

function StatusBreakdown({ summary }: { summary: CategorySummary }) {
  const rows = [
    { label: "Introduced", value: summary.introduced, dot: "bg-primary" },
    { label: "Practising", value: summary.practicing, dot: "bg-reward" },
    { label: "Mastered", value: summary.mastered, dot: "bg-success" },
  ];

  return (
    <dl className="mt-4 grid grid-cols-3 gap-3 text-center">
      {rows.map((row) => (
        <div key={row.label} className="rounded-image bg-surface-sunken px-2 py-3">
          <dt className="flex items-center justify-center gap-2 text-base text-ink-muted">
            <span aria-hidden="true" className={`size-2.5 rounded-full ${row.dot}`} />
            {row.label}
          </dt>
          <dd className="text-2xl font-extrabold">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export default function ProgressPage() {
  const { rewards, activity } = useSession();
  const progress = useProgressList();

  const letters = useMemo(() => summarise(ALPHABET, progress), [progress]);
  const numbers = useMemo(() => summarise(NUMBERS, progress), [progress]);

  const itemName = useMemo(() => {
    const map = new Map(ALL_ITEMS.map((item) => [item.id, item.displayValue]));
    return (id: string) => map.get(id) ?? id;
  }, []);

  const recent = activity.slice(0, 8);

  return (
    <>
      <PageHeader title="My progress" showBack={false} />

      <div className="flex flex-col gap-5 px-5 pb-8">
        <Card className="flex items-center gap-4">
          <StarCount stars={rewards.stars} size="lg" />
          <div className="flex-1 text-right">
            <p className="text-base text-ink-muted">Day streak</p>
            <p className="text-3xl font-extrabold">{rewards.streak}</p>
          </div>
        </Card>

        <Link
          href="/rewards"
          className="flex min-h-touch items-center gap-3 rounded-card bg-reward-soft px-5 py-4 font-bold text-ink shadow-card"
        >
          <span aria-hidden="true" className="text-3xl">
            🏅
          </span>
          See your badges
          <Icon name="next" size={22} className="ml-auto text-ink-muted" />
        </Link>

        <Card>
          <h2 className="text-xl font-extrabold">Letters</h2>
          <ProgressBar
            className="mt-3"
            label="A to Z"
            value={completionRatio(letters)}
            valueLabel={`${letters.mastered} of ${letters.total} mastered`}
          />
          <StatusBreakdown summary={letters} />
          <p className="mt-3 text-base text-ink-muted">
            {letters.traced} {letters.traced === 1 ? "letter" : "letters"} traced
          </p>
        </Card>

        <Card>
          <h2 className="text-xl font-extrabold">Numbers</h2>
          <ProgressBar
            className="mt-3"
            tone="success"
            label="0 to 20"
            value={completionRatio(numbers)}
            valueLabel={`${numbers.mastered} of ${numbers.total} mastered`}
          />
          <StatusBreakdown summary={numbers} />
          <p className="mt-3 text-base text-ink-muted">
            {numbers.traced} {numbers.traced === 1 ? "number" : "numbers"} traced
          </p>
        </Card>

        <Card>
          <h2 className="mb-3 text-xl font-extrabold">Recent activity</h2>
          {recent.length === 0 ? (
            <p className="text-lg text-ink-muted">
              Nothing yet. Anything you do will show up here.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {recent.map((event, index) => (
                <li
                  key={event.id ?? `${event.timestamp}-${index}`}
                  className="flex items-center gap-3 rounded-image bg-surface-sunken px-4 py-3"
                >
                  <span className="text-2xl font-extrabold">
                    {itemName(event.itemId)}
                  </span>
                  <span className="flex-1 text-base">{ACTIVITY_LABEL[event.kind]}</span>
                  <span className="text-base text-ink-muted">
                    {formatRelativeDay(event.timestamp)} · {formatTime(event.timestamp)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
