import { beforeEach, describe, expect, it, vi, afterEach } from "vitest";
import { HtmlAudioMusicPlayer, type MusicPlayer } from "@/lib/audio/MusicService";
import {
  DEFAULT_MUSIC_VOLUME,
  DUCKED_MUSIC_VOLUME,
  THEME_CUES,
  THEME_TRACK_URL,
} from "@/lib/audio/cues";
import { AudioService } from "@/lib/audio/AudioService";
import { SilentEffects } from "@/lib/audio/effects";
import type { SpeechProvider } from "@/lib/audio/providers";

/**
 * Theme music is a reward, not a bed. These tests pin the rules that keep it
 * from getting in the learner's way: it only ever plays the two declared cues,
 * it stops itself, and it always yields to speech.
 */

/** A stand-in for HTMLAudioElement, so playback can be observed. */
class FakeAudio {
  currentTime = 0;
  volume = 1;
  paused = true;
  preload = "";
  loop = false;
  playCalls = 0;
  /** When set, `play()` rejects — as browsers do before a user gesture. */
  refuse = false;

  play() {
    this.playCalls++;
    if (this.refuse) return Promise.reject(new Error("gesture required"));
    this.paused = false;
    return Promise.resolve();
  }

  pause() {
    this.paused = true;
  }
}

let fake: FakeAudio;

beforeEach(() => {
  vi.useFakeTimers();
  fake = new FakeAudio();
  vi.stubGlobal(
    "Audio",
    vi.fn(() => fake),
  );
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

/** Runs the fades and cue timers forward. */
async function advance(ms: number) {
  await vi.advanceTimersByTimeAsync(ms);
}

describe("cue definitions", () => {
  it("declares an opening and a celebration cue on one track", () => {
    expect(THEME_TRACK_URL).toMatch(/^\/audio\//);
    expect(THEME_CUES.opening.end).toBeGreaterThan(THEME_CUES.opening.start);
    expect(THEME_CUES.celebration.end).toBeGreaterThan(THEME_CUES.celebration.start);
  });

  it("gives the celebration cue roughly ten seconds", () => {
    const seconds = THEME_CUES.celebration.end - THEME_CUES.celebration.start;
    expect(seconds).toBeGreaterThan(8);
    expect(seconds).toBeLessThanOrEqual(12);
  });

  it("keeps the opening short so it never delays the learner", () => {
    expect(THEME_CUES.opening.end - THEME_CUES.opening.start).toBeLessThan(6);
  });

  it("ducks well below the normal level, so speech is always clearer", () => {
    expect(DUCKED_MUSIC_VOLUME).toBeLessThan(DEFAULT_MUSIC_VOLUME);
  });
});

describe("HtmlAudioMusicPlayer", () => {
  it("seeks to the cue and plays", async () => {
    const player = new HtmlAudioMusicPlayer();
    player.play("celebration");
    await advance(0);

    expect(fake.currentTime).toBe(THEME_CUES.celebration.start);
    expect(fake.paused).toBe(false);
  });

  it("fades in rather than starting at full volume", async () => {
    const player = new HtmlAudioMusicPlayer();
    player.play("opening");
    await advance(0);
    expect(fake.volume).toBe(0);

    await advance(200);
    expect(fake.volume).toBeCloseTo(DEFAULT_MUSIC_VOLUME, 2);
  });

  it("stops itself at the end of the cue", async () => {
    const player = new HtmlAudioMusicPlayer();
    player.play("celebration");
    await advance(200);
    expect(fake.paused).toBe(false);

    const cueMs = (THEME_CUES.celebration.end - THEME_CUES.celebration.start) * 1000;
    await advance(cueMs + 600);
    expect(fake.paused).toBe(true);
  });

  it("does not play past the cue and into the rest of the track", async () => {
    const player = new HtmlAudioMusicPlayer();
    player.play("opening");
    const openingMs = (THEME_CUES.opening.end - THEME_CUES.opening.start) * 1000;
    await advance(openingMs + 600);
    expect(fake.paused).toBe(true);
  });

  it("restarts the cue when a second success arrives", async () => {
    const player = new HtmlAudioMusicPlayer();
    player.play("celebration");
    await advance(2000);
    fake.currentTime = 8;

    player.play("celebration");
    await advance(0);
    expect(fake.currentTime).toBe(THEME_CUES.celebration.start);
    expect(fake.playCalls).toBe(2);
  });

  it("stops when the learner moves on", async () => {
    const player = new HtmlAudioMusicPlayer();
    player.play("celebration");
    await advance(200);

    player.stop();
    await advance(600);
    expect(fake.paused).toBe(true);
  });

  it("is safe to stop when nothing is playing", () => {
    const player = new HtmlAudioMusicPlayer();
    expect(() => player.stop()).not.toThrow();
  });

  it("drops the volume while ducked and restores it after", async () => {
    const player = new HtmlAudioMusicPlayer();
    player.play("celebration");
    await advance(200);

    player.duck();
    await advance(300);
    expect(fake.volume).toBeCloseTo(DUCKED_MUSIC_VOLUME, 2);

    player.unduck();
    await advance(400);
    expect(fake.volume).toBeCloseTo(DEFAULT_MUSIC_VOLUME, 2);
  });

  it("plays nothing at all when music is switched off", async () => {
    const player = new HtmlAudioMusicPlayer();
    player.setEnabled(false);
    player.play("celebration");
    await advance(200);
    expect(fake.playCalls).toBe(0);
  });

  it("stops what is playing when music is switched off mid-cue", async () => {
    const player = new HtmlAudioMusicPlayer();
    player.play("celebration");
    await advance(200);

    player.setEnabled(false);
    await advance(600);
    expect(fake.paused).toBe(true);
  });

  it("respects a custom volume", async () => {
    const player = new HtmlAudioMusicPlayer();
    player.setVolume(0.2);
    player.play("celebration");
    await advance(200);
    expect(fake.volume).toBeCloseTo(0.2, 2);
  });

  it("survives a browser refusing to autoplay", async () => {
    fake.refuse = true;
    const player = new HtmlAudioMusicPlayer();
    // The opening cue on a cold start is normally refused; it must not throw.
    expect(() => player.play("opening")).not.toThrow();
    await advance(200);
    expect(fake.paused).toBe(true);
  });

  it("replays a refused opening after the first user gesture", async () => {
    fake.refuse = true;
    const player = new HtmlAudioMusicPlayer();
    player.play("opening");
    await advance(50);
    expect(fake.paused).toBe(true);

    fake.refuse = false;
    window.dispatchEvent(new Event("pointerdown"));
    await advance(200);

    expect(fake.playCalls).toBeGreaterThan(1);
    expect(fake.paused).toBe(false);
  });

  it("does not resurrect a celebration the learner has moved past", async () => {
    fake.refuse = true;
    const player = new HtmlAudioMusicPlayer();
    player.play("celebration");
    await advance(50);

    fake.refuse = false;
    const before = fake.playCalls;
    window.dispatchEvent(new Event("pointerdown"));
    await advance(200);

    expect(fake.playCalls).toBe(before);
  });
});

describe("AudioService and music together", () => {
  function silentSpeech(): SpeechProvider {
    return {
      isAvailable: () => true,
      speak: () => Promise.resolve(),
      cancel: vi.fn(),
    };
  }

  function fakeMusic() {
    return {
      play: vi.fn(),
      stop: vi.fn(),
      duck: vi.fn(),
      unduck: vi.fn(),
      setEnabled: vi.fn(),
      setVolume: vi.fn(),
    } satisfies MusicPlayer;
  }

  const ON = { audioEnabled: true, soundEffectsEnabled: true, musicEnabled: true };

  it("launches the celebration hook on a correct answer", () => {
    const music = fakeMusic();
    const service = new AudioService(silentSpeech(), new SilentEffects(), music);
    service.setPreferences(ON);

    service.playSuccess();
    expect(music.play).toHaveBeenCalledWith("celebration");
  });

  it("plays no music on a wrong answer", () => {
    const music = fakeMusic();
    const service = new AudioService(silentSpeech(), new SilentEffects(), music);
    service.setPreferences(ON);

    service.playTryAgain();
    expect(music.play).not.toHaveBeenCalled();
  });

  it("plays the opening cue when the app opens", () => {
    const music = fakeMusic();
    const service = new AudioService(silentSpeech(), new SilentEffects(), music);
    service.setPreferences(ON);

    service.playOpeningTheme();
    expect(music.play).toHaveBeenCalledWith("opening");
  });

  it("plays no music at all when the setting is off", () => {
    const music = fakeMusic();
    const service = new AudioService(silentSpeech(), new SilentEffects(), music);
    service.setPreferences({ ...ON, musicEnabled: false });

    service.playSuccess();
    service.playOpeningTheme();
    expect(music.play).not.toHaveBeenCalled();
    expect(music.setEnabled).toHaveBeenCalledWith(false);
  });

  it("ducks the music around every spoken instruction", async () => {
    const music = fakeMusic();
    const service = new AudioService(silentSpeech(), new SilentEffects(), music);
    service.setPreferences(ON);

    await service.speakInstruction("Find A.");
    expect(music.duck).toHaveBeenCalled();
    expect(music.unduck).toHaveBeenCalled();
  });

  it("restores the music even when speech fails", async () => {
    const failing: SpeechProvider = {
      isAvailable: () => true,
      speak: () => Promise.reject(new Error("no")),
      cancel: vi.fn(),
    };
    const music = fakeMusic();
    const service = new AudioService(failing, new SilentEffects(), music);
    service.setPreferences(ON);

    await service.speakLetter("A");
    // Left ducked, the hook would stay quiet for the rest of the session.
    expect(music.unduck).toHaveBeenCalled();
  });

  it("cuts the music short when the learner moves on", () => {
    const music = fakeMusic();
    const service = new AudioService(silentSpeech(), new SilentEffects(), music);
    service.setPreferences(ON);

    service.stopMusic();
    expect(music.stop).toHaveBeenCalled();
  });
});
