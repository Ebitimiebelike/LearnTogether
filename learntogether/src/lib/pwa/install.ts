/**
 * Installing LearnTogether to a device's home screen.
 *
 * Two very different paths, because the platforms differ:
 *
 *  - **Android / Chromium**: the browser fires `beforeinstallprompt`, which can
 *    be saved and replayed later to open the real native install dialog. This
 *    is what makes a working "Install app" button possible.
 *  - **iOS / Safari**: Apple exposes no programmatic install at all. The only
 *    route is Share → Add to Home Screen, so the button shows instructions
 *    rather than pretending it can do it.
 *
 * The decision itself is a pure function so it can be tested without a browser.
 */

/** Not in TypeScript's DOM lib, as it is not a standardised event. */
export interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
}

export type InstallState =
  /** Already running from the home screen; nothing to offer. */
  | "installed"
  /** A native install dialog is available. */
  | "prompt"
  /** iOS: show Share → Add to Home Screen instructions. */
  | "ios-share"
  /** This browser cannot install; offer the browser experience instead. */
  | "unavailable";

export interface InstallSignals {
  /** True once `beforeinstallprompt` has been captured. */
  hasPrompt: boolean;
  isIOS: boolean;
  isStandalone: boolean;
}

/**
 * Decides what the install button should offer.
 *
 * Order matters: an already-installed app must never be asked to install
 * again, and a captured prompt beats the iOS instructions for the rare
 * Chromium-on-iPadOS case.
 */
export function resolveInstallState({
  hasPrompt,
  isIOS,
  isStandalone,
}: InstallSignals): InstallState {
  if (isStandalone) return "installed";
  if (hasPrompt) return "prompt";
  if (isIOS) return "ios-share";
  return "unavailable";
}

/** True when the page is running as an installed app rather than a browser tab. */
export function detectStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const displayMode = window.matchMedia?.("(display-mode: standalone)").matches ?? false;
  // Safari predates the display-mode media query and uses its own flag.
  const iosStandalone =
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return displayMode || iosStandalone;
}

/**
 * True on iPhone, iPod and iPad.
 *
 * iPadOS 13+ reports a desktop Macintosh user agent, so a Mac that reports
 * touch points is treated as an iPad — a desktop Mac reports none.
 */
export function detectIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return true;
  return /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
}
