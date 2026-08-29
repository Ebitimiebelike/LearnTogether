"use client";

import { NUMBERS } from "@/data/numbers";
import { LessonGrid } from "@/components/learning/LessonGrid";
import { PageHeader } from "@/components/ui/PageHeader";

export default function NumbersPage() {
  return (
    <>
      <PageHeader
        title="Numbers"
        subtitle="Tap a number to hear it"
        backHref="/learn"
      />
      <LessonGrid
        items={NUMBERS}
        columns={3}
        hrefFor={(item) => `/learn/numbers/${item.value}`}
      />
    </>
  );
}
