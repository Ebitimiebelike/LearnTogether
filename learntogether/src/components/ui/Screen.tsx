import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export interface ScreenProps {
  children: ReactNode;
  className?: string;
  /** Adds bottom padding so content clears the fixed bottom navigation. */
  withBottomNav?: boolean;
  /** Centres content vertically. Used by splash, onboarding and celebrations. */
  center?: boolean;
}

/**
 * The page shell. Caps line length on desktop while filling a tablet screen,
 * so the same layout works across the sizes the app targets.
 */
export function Screen({
  children,
  className,
  withBottomNav = false,
  center = false,
}: ScreenProps) {
  return (
    <div
      className={cn(
        // Wider in landscape, where there is horizontal room to spend; the
        // portrait cap keeps text at a comfortable reading measure.
        "mx-auto flex min-h-dvh w-full max-w-3xl flex-col landscape:max-w-5xl",
        withBottomNav && "pb-[calc(88px+env(safe-area-inset-bottom))]",
        center && "justify-center",
        className,
      )}
    >
      {children}
    </div>
  );
}
