import { notFound } from "next/navigation";
import { getNumber, NUMBER_SLUGS } from "@/data/numbers";
import { NumberLesson } from "@/features/numbers/NumberLesson";

export function generateStaticParams() {
  return NUMBER_SLUGS.map((number) => ({ number }));
}

export const dynamicParams = false;

export default async function NumberPage({
  params,
}: PageProps<"/learn/numbers/[number]">) {
  const { number } = await params;
  const item = getNumber(number);
  if (!item) notFound();
  return <NumberLesson item={item} />;
}
