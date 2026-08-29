import { notFound } from "next/navigation";
import { getLetter, LETTER_SLUGS } from "@/data/alphabet";
import { LetterTraceScreen } from "@/features/tracing/LetterTraceScreen";

export function generateStaticParams() {
  return LETTER_SLUGS.map((letter) => ({ letter }));
}

export const dynamicParams = false;

export default async function TraceLetterPage({
  params,
}: PageProps<"/trace/letters/[letter]">) {
  const { letter } = await params;
  const item = getLetter(letter);
  if (!item) notFound();
  return <LetterTraceScreen item={item} />;
}
