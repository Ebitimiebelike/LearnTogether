"use client";

import { ALPHABET } from "@/data/alphabet";
import { LessonGrid } from "@/components/learning/LessonGrid";
import { PageHeader } from "@/components/ui/PageHeader";

export default function TraceLettersPage() {
  return (
    <>
      <PageHeader
        title="Trace letters"
        subtitle="Choose a letter to practise"
        backHref="/trace"
      />
      <LessonGrid
        items={ALPHABET}
        hrefFor={(item) => `/trace/letters/${item.lowercase}`}
      />
    </>
  );
}
