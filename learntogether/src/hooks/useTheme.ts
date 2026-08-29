"use client";

import { useEffect } from "react";
import type { ThemeSetting } from "@/types";

/** Mirrors the chosen theme so it can be applied before hydration on reload. */
export const THEME_STORAGE_KEY = "learntogether:theme";

/**
 * Applies the theme to the document.
 *
 * The setting itself lives in IndexedDB, which cannot be read synchronously
 * during the first paint, so the value is also mirrored into localStorage
 * purely as a rendering hint for the inline script in the root layout.
 */
export function useTheme(theme: ThemeSetting) {
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "system") root.removeAttribute("data-theme");
    else root.dataset.theme = theme;

    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Storage can be blocked; the theme still applies for this session.
    }
  }, [theme]);
}
