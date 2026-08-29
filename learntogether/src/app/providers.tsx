"use client";

import { useEffect, type ReactNode } from "react";
import { SessionProvider, useSession } from "@/features/learners/SessionProvider";
import { registerServiceWorker } from "@/lib/pwa/register";
import { useTheme } from "@/hooks/useTheme";

/** Applies the stored theme once settings have loaded. */
function ThemeSync({ children }: { children: ReactNode }) {
  const { settings } = useSession();
  useTheme(settings.theme);
  return <>{children}</>;
}

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    void registerServiceWorker();
  }, []);

  return (
    <SessionProvider>
      <ThemeSync>{children}</ThemeSync>
    </SessionProvider>
  );
}
