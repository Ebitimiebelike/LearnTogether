import { describe, expect, it, vi } from "vitest";
import { AudioService } from "@/lib/audio/AudioService";
import { FallbackSpeechProvider, type SpeechProvider } from "@/lib/audio/providers";
import { SilentEffects } from "@/lib/audio/effects";
import { SilentMusicPlayer } from "@/lib/audio/MusicService";
import { getLetter } from "@/data/alphabet";
import { getNumber } from "@/data/numbers";

/**
 * Audio is always best-effort. The rule these tests protect is that no screen
 * can ever be blocked or broken by audio being unavailable, muted, or failing
 * halfway through.
 */

function recordingProvider(available = true) {
  const spoken: { text: string; audioUrl?: string }[] = [];
  const provider: SpeechProvider = {
    isAvailable: () => available,
    speak: async (request) => {
      spoken.push({ text: request.text, audioUrl: request.audioUrl });
    },
    cancel: vi.fn(),
  };
  return { provider, spoken };
}

function failingProvider(available = true): SpeechProvider {
  return {
    isAvailable: () => available,
    speak: () => Promise.reject(new Error("no")),
    cancel: vi.fn(),
  };
}

describe("AudioService", () => {
  it("speaks a letter by name", async () => {
    const { provider, spoken } = recordingProvider();
    await new AudioService(provider, new SilentEffects(), new SilentMusicPlayer()).speakLetter("a");
    expect(spoken[0].text).toBe("A");
  });

  it("speaks a number as a word, which is clearer than the digit", async () => {
    const { provider, spoken } = recordingProvider();
    const service = new AudioService(provider, new SilentEffects(), new SilentMusicPlayer());
    await service.speakItem(getNumber(3)!);
    expect(spoken[0].text).toBe("Three");
  });

  it("speaks a letter item as the letter itself", async () => {
    const { provider, spoken } = recordingProvider();
    await new AudioService(provider, new SilentEffects(), new SilentMusicPlayer()).speakItem(getLetter("B")!);
    expect(spoken[0].text).toBe("B");
  });

  it("passes a recorded clip's URL through when the item has one", async () => {
    const { provider, spoken } = recordingProvider();
    const service = new AudioService(provider, new SilentEffects(), new SilentMusicPlayer());
    await service.speakLetter("A", "/audio/letters/a.mp3");
    expect(spoken[0].audioUrl).toBe("/audio/letters/a.mp3");
  });

  it("speaks the phonetic hint", async () => {
    const { provider, spoken } = recordingProvider();
    await new AudioService(provider, new SilentEffects(), new SilentMusicPlayer()).speakSoundHint(getLetter("A")!);
    expect(spoken[0].text).toBe("A says ah.");
  });

  it("says nothing when audio is switched off", async () => {
    const { provider, spoken } = recordingProvider();
    const service = new AudioService(provider, new SilentEffects(), new SilentMusicPlayer());
    service.setPreferences({ audioEnabled: false, soundEffectsEnabled: true, musicEnabled: false });
    await service.speakInstruction("Find A.");
    expect(spoken).toEqual([]);
  });

  it("resolves rather than throwing when the device cannot speak", async () => {
    const service = new AudioService(failingProvider(), new SilentEffects(), new SilentMusicPlayer());
    // The important part is that this settles: a rejection here would surface
    // as an unhandled error inside a lesson screen.
    await expect(service.speakInstruction("Find A.")).resolves.toBeUndefined();
  });

  it("resolves when no provider is available at all", async () => {
    const service = new AudioService(failingProvider(false), new SilentEffects(), new SilentMusicPlayer());
    await expect(service.speakLetter("A")).resolves.toBeUndefined();
    expect(service.isSpeechAvailable()).toBe(false);
  });

  it("reports whether the device can speak, so the UI can explain silence", () => {
    const { provider } = recordingProvider(true);
    expect(new AudioService(provider, new SilentEffects(), new SilentMusicPlayer()).isSpeechAvailable()).toBe(true);
  });

  it("plays no effects when they are switched off", () => {
    const effects = {
      playSuccess: vi.fn(),
      playTryAgain: vi.fn(),
    };
    const { provider } = recordingProvider();
    const service = new AudioService(provider, effects, new SilentMusicPlayer());
    service.setPreferences({ audioEnabled: true, soundEffectsEnabled: false, musicEnabled: false });

    service.playSuccess();
    service.playTryAgain();
    expect(effects.playSuccess).not.toHaveBeenCalled();
    expect(effects.playTryAgain).not.toHaveBeenCalled();
  });

  it("plays effects when they are switched on", () => {
    const effects = {
      playSuccess: vi.fn(),
      playTryAgain: vi.fn(),
    };
    const { provider } = recordingProvider();
    const service = new AudioService(provider, effects, new SilentMusicPlayer());
    service.setPreferences({ audioEnabled: true, soundEffectsEnabled: true, musicEnabled: false });

    service.playSuccess();
    expect(effects.playSuccess).toHaveBeenCalledOnce();
  });
});

describe("FallbackSpeechProvider", () => {
  it("uses the first provider that succeeds", async () => {
    const { provider: second, spoken } = recordingProvider();
    const fallback = new FallbackSpeechProvider([failingProvider(), second]);
    await fallback.speak({ text: "A" });
    expect(spoken).toHaveLength(1);
  });

  it("prefers a recording over synthesis when both work", async () => {
    const first = recordingProvider();
    const second = recordingProvider();
    const fallback = new FallbackSpeechProvider([first.provider, second.provider]);
    await fallback.speak({ text: "A", audioUrl: "/audio/a.mp3" });
    expect(first.spoken).toHaveLength(1);
    expect(second.spoken).toHaveLength(0);
  });

  it("skips providers that report themselves unavailable", async () => {
    const skipped = recordingProvider(false);
    const used = recordingProvider(true);
    const fallback = new FallbackSpeechProvider([skipped.provider, used.provider]);
    await fallback.speak({ text: "A" });
    expect(skipped.spoken).toHaveLength(0);
    expect(used.spoken).toHaveLength(1);
  });

  it("settles quietly when every provider fails", async () => {
    const fallback = new FallbackSpeechProvider([failingProvider(), failingProvider()]);
    await expect(fallback.speak({ text: "A" })).resolves.toBeUndefined();
  });

  it("is unavailable only when no provider is", () => {
    expect(new FallbackSpeechProvider([failingProvider(false)]).isAvailable()).toBe(false);
    expect(
      new FallbackSpeechProvider([failingProvider(false), failingProvider(true)]).isAvailable(),
    ).toBe(true);
  });

  it("cancels every provider", () => {
    const a = failingProvider();
    const b = failingProvider();
    new FallbackSpeechProvider([a, b]).cancel();
    expect(a.cancel).toHaveBeenCalled();
    expect(b.cancel).toHaveBeenCalled();
  });
});
