"use client";

import { NUMBERS } from "@/data/numbers";
import { PageHeader } from "@/components/ui/PageHeader";
import { PracticeActivity } from "@/features/practice/PracticeActivity";

export default function PracticeNumbersPage() {
  return (
    <>
      <PageHeader title="Find the number" backHref="/practice" />
      <PracticeActivity pool={NUMBERS} mode="identify" doneHref="/practice" />
    </>
  );
}
