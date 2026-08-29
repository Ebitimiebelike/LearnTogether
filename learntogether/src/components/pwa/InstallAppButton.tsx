"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useInstallApp } from "@/hooks/useInstallApp";

/**
 * Safari's Share glyph — a box with an arrow leaving the top.
 *
 * Drawn inline rather than using Apple's SF Symbols character, which renders as
 * a blank box on every non-Apple device.
 */
function ShareIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label="Share"
      className="inline-block align-text-bottom text-primary"
    >
      <path d="M12 3v12" />
      <path d="M8 6.5 12 2.5l4 4" />
      <path d="M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1" />
    </svg>
  );
}

export interface InstallAppButtonProps {
  /** Hides the button entirely once installed, rather than showing a note. */
  hideWhenInstalled?: boolean;
  className?: string;
}

/**
 * The "Install app" button.
 *
 * On Android it opens the browser's real install dialog. On iOS, where Apple
 * allows no such thing, it opens the Share → Add to Home Screen instructions
 * instead — the honest option, rather than a button that silently does nothing.
 */
export function InstallAppButton({
  hideWhenInstalled = false,
  className,
}: InstallAppButtonProps) {
  const { state, install, ready } = useInstallApp();
  const [showIOSHelp, setShowIOSHelp] = useState(false);
  const [installing, setInstalling] = useState(false);

  if (state === "installed") {
    if (hideWhenInstalled) return null;
    return (
      <p className={className} role="status">
        <span className="flex min-h-touch items-center justify-center gap-3 rounded-card bg-success-soft px-5 py-4 text-lg font-bold">
          <span aria-hidden="true">✅</span> Installed on this device
        </span>
      </p>
    );
  }

  if (state === "prompt") {
    return (
      <Button
        size="lg"
        fullWidth
        icon="home"
        disabled={installing}
        className={className}
        onClick={async () => {
          setInstalling(true);
          await install();
          setInstalling(false);
        }}
      >
        {installing ? "Installing…" : "Install app"}
      </Button>
    );
  }

  if (state === "ios-share") {
    return (
      <>
        <Button
          size="lg"
          fullWidth
          icon="home"
          className={className}
          onClick={() => setShowIOSHelp(true)}
        >
          Install app
        </Button>

        <Modal
          open={showIOSHelp}
          title="Add to your Home Screen"
          onClose={() => setShowIOSHelp(false)}
          footer={
            <Button fullWidth onClick={() => setShowIOSHelp(false)}>
              Got it
            </Button>
          }
        >
          <ol className="flex list-none flex-col gap-4 text-lg text-ink">
            <li className="flex gap-3">
              <span className="font-extrabold text-primary">1.</span>
              <span>
                Tap the <strong>Share</strong> button <ShareIcon /> at the
                bottom of Safari.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="font-extrabold text-primary">2.</span>
              <span>
                Scroll down and tap <strong>Add to Home Screen</strong>.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="font-extrabold text-primary">3.</span>
              <span>
                Tap <strong>Add</strong>. LearnTogether will appear with your
                other apps.
              </span>
            </li>
          </ol>
          <p className="mt-5 text-base">
            It only works in Safari on iPhone and iPad — other browsers on iOS
            cannot add apps to the Home Screen.
          </p>
        </Modal>
      </>
    );
  }

  // "unavailable": a desktop browser, or one that does not support installing.
  // Say nothing until the browser has had its chance to offer a prompt.
  if (!ready) return null;

  return (
    <p
      className={`rounded-card bg-surface-sunken px-5 py-4 text-base text-ink-muted ${className ?? ""}`}
    >
      To install LearnTogether as an app, open this page on an Android tablet or
      phone in Chrome, or on an iPad or iPhone in Safari. It works in this
      browser in the meantime.
    </p>
  );
}
