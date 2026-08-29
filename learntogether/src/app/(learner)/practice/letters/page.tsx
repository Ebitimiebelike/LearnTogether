"use client";

import { ALPHABET } from "@/data/alphabet";
import { PageHeader } from "@/components/ui/PageHeader";
import { PracticeActivity } from "@/features/practice/PracticeActivity";

export default function PracticeLettersPage() {
  return (
    <>
      <PageHeader title="Find the letter" backHref="/practice" />
      <PracticeActivity pool={ALPHABET} mode="identify" doneHref="/practice" />
    </>
  );
}
