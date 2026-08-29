"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { Icon, type IconName } from "./Icon";

interface NavItem {
  href: string;
  label: string;
  icon: IconName;
  /** Also highlight this tab for these path prefixes. */
  matches: string[];
}

/**
 * Four destinations, deliberately. Rewards, Games, Tracing and the caregiver
 * area are all reachable from Home or Learn rather than crowding this bar.
 */
const ITEMS: NavItem[] = [
  { href: "/home", label: "Home", icon: "home", matches: ["/home"] },
  { href: "/learn", label: "Learn", icon: "book", matches: ["/learn", "/trace"] },
  {
    href: "/practice",
    label: "Practice",
    icon: "practice",
    matches: ["/practice", "/games"],
  },
  {
    href: "/progress",
    label: "Progress",
    icon: "progress",
    matches: ["/progress", "/rewards"],
  },
];

export function BottomNavigation() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-20 border-t-2 border-border-subtle bg-surface pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="mx-auto flex max-w-3xl">
        {ITEMS.map((item) => {
          const active = item.matches.some(
            (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
          );
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-touch flex-col items-center justify-center gap-1 px-2 py-2 font-semibold",
                  active ? "text-primary" : "text-ink-muted",
                )}
              >
                <Icon name={item.icon} size={30} />
                <span className="text-sm">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
