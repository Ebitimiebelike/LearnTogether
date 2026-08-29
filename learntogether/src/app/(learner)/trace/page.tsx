import { CategoryCard } from "@/components/learning/CategoryCard";
import { PageHeader } from "@/components/ui/PageHeader";

export default function TracePage() {
  return (
    <>
      <PageHeader
        title="Trace"
        subtitle="Follow the line with your finger"
        backHref="/learn"
      />
      <div className="grid grid-cols-1 gap-4 px-5 pb-8 sm:grid-cols-2">
        <CategoryCard
          href="/trace/letters"
          title="Trace letters"
          description="Big and small letters, A to Z"
          emoji="✍️"
          tone="primary"
        />
        <CategoryCard
          href="/trace/numbers"
          title="Trace numbers"
          description="0 to 20"
          emoji="🔟"
          tone="success"
        />
      </div>
    </>
  );
}
