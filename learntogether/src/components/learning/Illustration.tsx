import { cn } from "@/lib/utils/cn";
import type { LearningItem } from "@/types";

export interface IllustrationProps {
  item: LearningItem;
  /** Rendered emoji size in pixels. */
  size?: number;
  className?: string;
}

/**
 * The picture beside a lesson.
 *
 * The MVP draws it with an emoji glyph rather than artwork: emoji render from
 * fonts already on the device, so illustrations cost nothing to download, work
 * offline from the very first load, and carry no licensing questions. The
 * `image` field on `LearningItem` is reserved for commissioned artwork; when it
 * is supplied it is used instead.
 */
export function Illustration({ item, size = 96, className }: IllustrationProps) {
  const label = item.word ?? item.writtenWord ?? item.value;

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-image bg-surface-sunken",
        className,
      )}
    >
      {item.image ? (
        // eslint-disable-next-line @next/next/no-img-element -- local static asset, no optimisation needed offline
        <img src={item.image} alt={label} width={size} height={size} />
      ) : (
        <span
          role="img"
          aria-label={label}
          style={{ fontSize: size, lineHeight: 1.15 }}
          className="select-none"
        >
          {item.emoji}
        </span>
      )}
    </div>
  );
}
