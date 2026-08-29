"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import {
  detectIOS,
  detectStandalone,
  resolveInstallState,
  type BeforeInstallPromptEvent,
  type InstallState,
} from "@/lib/pwa/install";

/**
 * Drives the "Install app" button.
 *
 * Captures Chromium's `beforeinstallprompt` so the install dialog can be opened
 * from a button people can actually find, rather than leaving it buried in the
 * browser menu.
 *
 * Browser-only facts are read through `useSyncExternalStore` rather than being
 * assigned into state from an effect: it renders `false` on the server and the
 * real value on the client without a hydration mismatch, and without the
 * cascading re-render that setting state inside an effect would cause.
 */

/** Never changes for the life of the page, so there is nothing to subscribe to. */
function noSubscribe() {
  return () => {};
}

/** Standalone flips when the app is launched from the home screen. */
function subscribeToDisplayMode(onChange: () => void) {
  if (typeof window === "undefined" || !window.matchMedia) return () => {};
  const query = window.matchMedia("(display-mode: standalone)");
  query.addEventListener?.("change", onChange);
  return () => query.removeEventListener?.("change", onChange);
}

/** True when the page is running as an installed app rather than a browser tab. */
export function useIsStandalone(): boolean {
  return useSyncExternalStore(
    subscribeToDisplayMode,
    detectStandalone,
    // The server cannot know; assume a browser tab and correct on hydration.
    () => false,
  );
}

function useIsIOS(): boolean {
  return useSyncExternalStore(noSubscribe, detectIOS, () => false);
}

export function useInstallApp() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  /**
   * Installing does not turn the current tab into a standalone window, so
   * success is tracked separately from `useIsStandalone`.
   */
  const [justInstalled, setJustInstalled] = useState(false);
  const [ready, setReady] = useState(false);

  const isStandalone = useIsStandalone();
  const isIOS = useIsIOS();

  useEffect(() => {
    const onBeforeInstallPrompt = (event: Event) => {
      // Stop Chrome showing its own mini-infobar; the page offers the button.
      event.preventDefault();
      setPromptEvent(event as BeforeInstallPromptEvent);
    };

    const onInstalled = () => {
      setPromptEvent(null);
      setJustInstalled(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);

    // The event fires shortly after load, so the button waits a moment before
    // deciding installing is unavailable. This avoids flashing "can't install"
    // on a browser that is about to say it can.
    const settle = setTimeout(() => setReady(true), 1200);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      clearTimeout(settle);
    };
  }, []);

  const state: InstallState = resolveInstallState({
    hasPrompt: promptEvent !== null,
    isIOS,
    isStandalone: isStandalone || justInstalled,
  });

  /**
   * Opens the native install dialog. Resolves to true if the app was installed.
   * A prompt can only be used once, so it is discarded either way.
   */
  const install = useCallback(async () => {
    if (!promptEvent) return false;
    try {
      await promptEvent.prompt();
      const { outcome } = await promptEvent.userChoice;
      setPromptEvent(null);
      return outcome === "accepted";
    } catch {
      // A prompt that has already been used throws; treat it as declined.
      setPromptEvent(null);
      return false;
    }
  }, [promptEvent]);

  return { state, install, ready };
}
