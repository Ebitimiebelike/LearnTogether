import { CategoryCard } from "@/components/learning/CategoryCard";
import { PageHeader } from "@/components/ui/PageHeader";

/** The Practice hub. Three activities, described in a few words each. */
export default function PracticePage() {
  return (
    <>
      <PageHeader
        title="Practice"
        subtitle="Nothing here is timed"
        showBack={false}
      />
      <div className="grid grid-cols-1 gap-4 px-5 pb-8 sm:grid-cols-2">
        <CategoryCard
          href="/practice/letters"
          title="Find the letter"
          description="Listen, then tap the right letter"
          emoji="🔤"
          tone="primary"
        />
        <CategoryCard
          href="/practice/numbers"
          title="Find the number"
          description="Listen, then tap the right number"
          emoji="🔢"
          tone="success"
        />
        <CategoryCard
          href="/practice/listening"
          title="Listen and choose"
          description="Hear a letter or number, then find it"
          emoji="👂"
        />
        <CategoryCard
          href="/games"
          title="Matching game"
          description="Match letters and numbers to pictures"
          emoji="🧩"
          tone="reward"
        />
      </div>
    </>
  );
}
