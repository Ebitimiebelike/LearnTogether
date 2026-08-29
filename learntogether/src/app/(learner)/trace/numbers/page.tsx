"use client";

import { NUMBERS } from "@/data/numbers";
import { LessonGrid } from "@/components/learning/LessonGrid";
import { PageHeader } from "@/components/ui/PageHeader";

export default function TraceNumbersPage() {
  return (
    <>
      <PageHeader
        title="Trace numbers"
        subtitle="Choose a number to practise"
        backHref="/trace"
      />
      <LessonGrid
        items={NUMBERS}
        columns={3}
        hrefFor={(item) => `/trace/numbers/${item.value}`}
      />
    </>
  );
}
