"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AVATARS, DEFAULT_AVATAR } from "@/data/avatars";
import { AvatarCard } from "@/components/rewards/AvatarCard";
import { Button } from "@/components/ui/Button";
import { Screen } from "@/components/ui/Screen";
import { useSession } from "@/features/learners/SessionProvider";

/**
 * Create Learner: name, age and avatar, and nothing else.
 *
 * No email, no account, no sign-in. Everything entered here stays on the
 * device.
 */

const MIN_AGE = 2;
const MAX_AGE = 99;

export function CreateLearnerForm() {
  const router = useRouter();
  const { createLearner } = useSession();

  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [avatar, setAvatar] = useState(DEFAULT_AVATAR);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (saving) return;

    const trimmed = name.trim();
    if (trimmed.length === 0) {
      setError("Please add a name.");
      return;
    }

    const parsedAge = Number(age);
    if (!Number.isFinite(parsedAge) || parsedAge < MIN_AGE || parsedAge > MAX_AGE) {
      setError(`Please add an age between ${MIN_AGE} and ${MAX_AGE}.`);
      return;
    }

    setError(null);
    setSaving(true);
    await createLearner({ name: trimmed, age: Math.round(parsedAge), avatar });
    router.push("/first-lesson");
  };

  return (
    <Screen className="px-6 py-8">
      <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-7">
        <header>
          <h1 className="text-3xl font-extrabold">Who is learning?</h1>
          <p className="mt-2 text-lg text-ink-muted">
            This stays on this device. No account needed.
          </p>
        </header>

        <div className="flex flex-col gap-2">
          <label htmlFor="learner-name" className="text-lg font-bold">
            Name
          </label>
          <input
            id="learner-name"
            name="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="off"
            autoCapitalize="words"
            className="min-h-touch rounded-button border-2 border-border-subtle bg-surface px-5 text-xl"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="learner-age" className="text-lg font-bold">
            Age
          </label>
          <input
            id="learner-age"
            name="age"
            // `inputMode` gives a number pad without the fiddly spinner arrows.
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={age}
            onChange={(event) => setAge(event.target.value.replace(/\D/g, "").slice(0, 2))}
            className="min-h-touch w-32 rounded-button border-2 border-border-subtle bg-surface px-5 text-xl"
          />
        </div>

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-1 text-lg font-bold">Choose an avatar</legend>
          <div className="grid grid-cols-4 gap-3 max-[420px]:grid-cols-3">
            {AVATARS.map((option) => (
              <AvatarCard
                key={option.id}
                avatarId={option.id}
                selected={avatar === option.id}
                onSelect={() => setAvatar(option.id)}
              />
            ))}
          </div>
        </fieldset>

        {error && (
          <p role="alert" className="rounded-card bg-gentle-soft px-5 py-4 text-lg font-semibold">
            {error}
          </p>
        )}

        <Button type="submit" size="lg" fullWidth disabled={saving} className="mt-auto">
          {saving ? "Saving…" : "Start learning"}
        </Button>
      </form>
    </Screen>
  );
}
