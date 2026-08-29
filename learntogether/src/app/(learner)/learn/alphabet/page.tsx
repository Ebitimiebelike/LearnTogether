"use client";

import { ALPHABET } from "@/data/alphabet";
import { LessonGrid } from "@/components/learning/LessonGrid";
import { PageHeader } from "@/components/ui/PageHeader";

export default function AlphabetPage() {
  return (
    <>
      <PageHeader
        title="Letters"
        subtitle="Tap a letter to hear it"
        backHref="/learn"
      />
      <LessonGrid
        items={ALPHABET}
        hrefFor={(item) => `/learn/alphabet/${item.lowercase}`}
      />
    </>
  );
}
