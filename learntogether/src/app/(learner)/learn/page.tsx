import { CategoryCard } from "@/components/learning/CategoryCard";
import { PageHeader } from "@/components/ui/PageHeader";

/** The Learn hub: two lessons areas and the tracing area, nothing else. */
export default function LearnPage() {
  return (
    <>
      <PageHeader
        title="Learn"
        subtitle="Pick something to explore"
        showBack={false}
      />
      <div className="grid grid-cols-1 gap-4 px-5 pb-8 sm:grid-cols-2">
        <CategoryCard
          href="/learn/alphabet"
          title="Letters"
          description="A to Z, with a word and a picture for each one"
          emoji="🔤"
          tone="primary"
        />
        <CategoryCard
          href="/learn/numbers"
          title="Numbers"
          description="0 to 20, with things to count"
          emoji="🔢"
          tone="success"
        />
        <CategoryCard
          href="/trace"
          title="Trace"
          description="Practise writing letters and numbers"
          emoji="✏️"
        />
      </div>
    </>
  );
}
