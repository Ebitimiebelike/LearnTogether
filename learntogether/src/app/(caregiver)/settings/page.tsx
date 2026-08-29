"use client";

import { useState } from "react";
import { AVATARS } from "@/data/avatars";
import { AvatarCard } from "@/components/rewards/AvatarCard";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { useSession } from "@/features/learners/SessionProvider";
import { InstallAppButton } from "@/components/pwa/InstallAppButton";
import { PIN_LENGTH, isValidPinFormat } from "@/features/caregiver/pin";
import { useAudio } from "@/hooks/useAudio";
import { cn } from "@/lib/utils/cn";
import type { ThemeSetting } from "@/types";

/**
 * Settings.
 *
 * Lives outside the learner's navigation, alongside the caregiver area, because
 * these are adult decisions — but it is not itself PIN-locked, so audio can be
 * turned down quickly mid-session.
 */

const THEMES: { value: ThemeSetting; label: string }[] = [
  { value: "system", label: "Automatic" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex min-h-touch w-full items-center gap-4 rounded-card bg-surface px-5 py-4 text-left shadow-card"
    >
      <span className="flex-1">
        <span className="block text-lg font-bold">{label}</span>
        <span className="block text-base text-ink-muted">{description}</span>
      </span>
      <span
        aria-hidden="true"
        className={cn(
          "flex h-9 w-16 shrink-0 items-center rounded-full p-1 transition-colors",
          checked ? "bg-success" : "bg-border-subtle",
        )}
      >
        <span
          className={cn(
            "size-7 rounded-full bg-surface shadow-card transition-transform",
            checked && "translate-x-7",
          )}
        />
      </span>
    </button>
  );
}

export default function SettingsPage() {
  const { learner, settings, updateSettings, updateLearner } = useSession();
  const audio = useAudio();

  const [pin, setPin] = useState("");
  const [pinMessage, setPinMessage] = useState<string | null>(null);

  const savePin = async () => {
    if (!isValidPinFormat(pin)) {
      setPinMessage(`Please enter ${PIN_LENGTH} digits.`);
      return;
    }
    await updateSettings({ caregiverPin: pin });
    setPin("");
    setPinMessage("PIN saved.");
  };

  return (
    <>
      <PageHeader title="Settings" backHref="/home" />

      <div className="flex flex-col gap-5 px-5 pb-10">
        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-extrabold">Sound</h2>
          <Toggle
            label="Spoken audio"
            description="Letters, numbers and instructions are read aloud."
            checked={settings.audioEnabled}
            onChange={(value) => void updateSettings({ audioEnabled: value })}
          />
          <Toggle
            label="Sound effects"
            description="Short tones for correct answers and encouragement."
            checked={settings.soundEffectsEnabled}
            onChange={(value) => void updateSettings({ soundEffectsEnabled: value })}
          />
          <Toggle
            label="Theme music"
            description="A short tune when the app opens, and again for about ten seconds after a correct answer. It quietens whenever anything is spoken."
            checked={settings.musicEnabled}
            onChange={(value) => void updateSettings({ musicEnabled: value })}
          />
          <Button
            variant="secondary"
            icon="speaker"
            onClick={() => void audio.speakInstruction("This is how the app sounds.")}
          >
            Test the voice
          </Button>
          {!audio.isSpeechAvailable() && (
            <p className="rounded-card bg-gentle-soft px-5 py-4 text-base">
              This device has no built-in speech voice, so nothing will be read
              aloud. Everything else in the app still works.
            </p>
          )}
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-extrabold">App</h2>
          <InstallAppButton />
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-extrabold">Appearance</h2>
          <div role="group" aria-label="Theme" className="flex gap-3 rounded-card bg-surface-sunken p-2">
            {THEMES.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={settings.theme === option.value}
                onClick={() => void updateSettings({ theme: option.value })}
                className={cn(
                  "min-h-touch flex-1 rounded-button text-lg font-bold transition-colors",
                  settings.theme === option.value
                    ? "bg-primary text-on-primary shadow-card"
                    : "text-ink-muted",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </section>

        {learner && (
          <section className="flex flex-col gap-3">
            <h2 className="text-xl font-extrabold">Learner</h2>
            <Card>
              <label htmlFor="learner-name" className="text-lg font-bold">
                Name
              </label>
              <input
                id="learner-name"
                value={learner.name}
                onChange={(event) => void updateLearner({ name: event.target.value })}
                className="mt-2 min-h-touch w-full rounded-button border-2 border-border-subtle bg-surface px-5 text-xl"
              />

              <p className="mt-5 mb-2 text-lg font-bold">Avatar</p>
              <div className="grid grid-cols-4 gap-3 max-[420px]:grid-cols-3">
                {AVATARS.map((option) => (
                  <AvatarCard
                    key={option.id}
                    avatarId={option.id}
                    selected={learner.avatar === option.id}
                    onSelect={() => void updateLearner({ avatar: option.id })}
                  />
                ))}
              </div>
            </Card>
          </section>
        )}

        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-extrabold">Caregiver PIN</h2>
          <Card>
            <p className="text-base text-ink-muted">
              {settings.caregiverPin === null
                ? "No PIN is set, so the caregiver area is open to anyone using this device."
                : "A PIN is set. Enter a new one below to change it."}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <input
                aria-label="New caregiver PIN"
                inputMode="numeric"
                pattern="[0-9]*"
                type="password"
                value={pin}
                onChange={(event) => {
                  setPinMessage(null);
                  setPin(event.target.value.replace(/\D/g, "").slice(0, PIN_LENGTH));
                }}
                placeholder={"•".repeat(PIN_LENGTH)}
                className="min-h-touch w-36 rounded-button border-2 border-border-subtle bg-surface px-5 text-center text-2xl tracking-[0.4em]"
              />
              <Button onClick={savePin}>Save PIN</Button>
              {settings.caregiverPin !== null && (
                <Button
                  variant="secondary"
                  onClick={async () => {
                    await updateSettings({ caregiverPin: null });
                    setPinMessage("PIN removed.");
                  }}
                >
                  Remove PIN
                </Button>
              )}
            </div>
            {pinMessage && (
              <p role="status" className="mt-3 text-base font-semibold">
                {pinMessage}
              </p>
            )}
            <p className="mt-4 text-base text-ink-muted">
              The PIN is stored on this device only and cannot be recovered if it
              is forgotten. It keeps the learner out of the caregiver area; it is
              not a security feature.
            </p>
          </Card>
        </section>

        <ButtonLink href="/caregiver" size="lg" icon="lock" fullWidth>
          Caregiver area
        </ButtonLink>
      </div>
    </>
  );
}
