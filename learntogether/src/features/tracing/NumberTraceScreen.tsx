"use client";

import { NUMBERS } from "@/data/numbers";
import { getNumberTrace } from "@/data/tracing";
import { PageHeader } from "@/components/ui/PageHeader";
import { TraceActivity } from "./TraceActivity";
import type { LearningItem } from "@/types";

export interface NumberTraceScreenProps {
  item: LearningItem;
}

/** Tracing one number, reusing exactly the same engine as letters. */
export function NumberTraceScreen({ item }: NumberTraceScreenProps) {
  const value = Number(item.value);
  const next = NUMBERS[value + 1];
  const trace = getNumberTrace(item.value);

  if (!trace) return null;

  return (
    <>
      <PageHeader
        title={`Trace ${item.displayValue}`}
        subtitle={item.writtenWord}
        backHref="/trace/numbers"
      />
      <TraceActivity
        item={item}
        character={trace.character}
        strokes={trace.strokes}
        nextHref={next ? `/trace/numbers/${next.value}` : null}
        finishHref="/trace/numbers"
      />
    </>
  );
}
