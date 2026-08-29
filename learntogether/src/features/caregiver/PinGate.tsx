"use client";

import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { useSession } from "@/features/learners/SessionProvider";
import { checkPin, PIN_LENGTH } from "./pin";
import { cn } from "@/lib/utils/cn";

/**
 * Guards the caregiver area behind a local PIN.
 *
 * The keypad is deliberately plain and adult-facing, and the digits are large
 * because this may be tapped on the same tablet by someone standing over it.
 *
 * The PIN is a "keep the learner out of settings" lock, not a security
 * boundary — see the note in `pin.ts`.
 */
export function PinGate({ children }: { children: ReactNode }) {
  const { settings, updateSettings } = useSession();
  const [entry, setEntry] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState(false);

  // With no PIN set, the area is open; Settings offers to add one.
  if (unlocked || settings.caregiverPin === null) return <>{children}</>;

  const press = (digit: string) => {
    setError(null);
    const next = (entry + digit).slice(0, PIN_LENGTH);
    setEntry(next);

    if (next.length === PIN_LENGTH) {
      if (checkPin(next, settings.caregiverPin)) {
        setUnlocked(true);
      } else {
        setError("That PIN did not match. Try again.");
        setEntry("");
      }
    }
  };

  return (
    <>
      <PageHeader title="Caregiver area" backHref="/home" />
      <div className="flex flex-col gap-6 px-5 pb-8">
        <Card className="flex flex-col items-center gap-4 text-center">
          <span aria-hidden="true" className="text-5xl">
            🔒
          </span>
          <p className="text-xl font-bold">Enter the caregiver PIN</p>

          <div className="flex gap-3" aria-hidden="true">
            {Array.from({ length: PIN_LENGTH }, (_, index) => (
              <span
                key={index}
                className={cn(
                  "size-5 rounded-full border-2",
                  index < entry.length
                    ? "border-primary bg-primary"
                    : "border-border-subtle",
                )}
              />
            ))}
          </div>
          <p className="sr-only" role="status">
            {entry.length} of {PIN_LENGTH} digits entered
          </p>

          {error && (
            <p role="alert" className="text-lg font-semibold text-gentle">
              {error}
            </p>
          )}
        </Card>

        <div className="grid grid-cols-3 gap-3">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
            <Button key={digit} size="lg" variant="secondary" onClick={() => press(digit)}>
              {digit}
            </Button>
          ))}
          <Button
            size="lg"
            variant="quiet"
            onClick={() => {
              setEntry("");
              setError(null);
            }}
          >
            Clear
          </Button>
          <Button size="lg" variant="secondary" onClick={() => press("0")}>
            0
          </Button>
          <Button size="lg" variant="quiet" onClick={() => setEntry(entry.slice(0, -1))}>
            Delete
          </Button>
        </div>

        <details className="rounded-card bg-surface-sunken p-5">
          <summary className="min-h-touch cursor-pointer text-lg font-semibold">
            Forgotten the PIN?
          </summary>
          <p className="mt-3 text-base text-ink-muted">
            The PIN is stored only on this device and cannot be recovered. You can
            clear it here, which reopens the caregiver area. Learner progress is
            not affected.
          </p>
          <Button
            className="mt-4"
            variant="secondary"
            onClick={async () => {
              await updateSettings({ caregiverPin: null });
              setUnlocked(true);
            }}
          >
            Clear the PIN
          </Button>
        </details>
      </div>
    </>
  );
}
