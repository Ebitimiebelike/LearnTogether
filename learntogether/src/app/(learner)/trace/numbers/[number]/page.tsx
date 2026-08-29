import { notFound } from "next/navigation";
import { getNumber, NUMBER_SLUGS } from "@/data/numbers";
import { NumberTraceScreen } from "@/features/tracing/NumberTraceScreen";

export function generateStaticParams() {
  return NUMBER_SLUGS.map((number) => ({ number }));
}

export const dynamicParams = false;

export default async function TraceNumberPage({
  params,
}: PageProps<"/trace/numbers/[number]">) {
  const { number } = await params;
  const item = getNumber(number);
  if (!item) notFound();
  return <NumberTraceScreen item={item} />;
}
