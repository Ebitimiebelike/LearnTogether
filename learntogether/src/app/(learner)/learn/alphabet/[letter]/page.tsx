import { notFound } from "next/navigation";
import { getLetter, LETTER_SLUGS } from "@/data/alphabet";
import { LetterLesson } from "@/features/alphabet/LetterLesson";

/**
 * All 26 letter pages are prerendered at build time. That is what makes them
 * available offline: Serwist precaches the generated HTML for every route.
 */
export function generateStaticParams() {
  return LETTER_SLUGS.map((letter) => ({ letter }));
}

/** Only the prerendered letters exist; anything else is a 404. */
export const dynamicParams = false;

export default async function LetterPage({
  params,
}: PageProps<"/learn/alphabet/[letter]">) {
  const { letter } = await params;
  const item = getLetter(letter);
  if (!item) notFound();
  return <LetterLesson item={item} />;
}
