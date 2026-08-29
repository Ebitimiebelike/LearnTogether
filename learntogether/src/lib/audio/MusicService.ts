/**
 * Theme music playback.
 *
 * The app plays music in two places only — a short flourish when it opens, and
 * the hook when the learner gets something right. It is never a continuous
 * background bed, because spoken instructions are the app's primary channel and
 * nothing should compete with them.
 *
 * Both are regions of one file, described in `cues.ts`. This service seeks to a
 * cue, fades in, and stops itself at the cue's end.
 */
import {
  DEFAULT_MUSIC_VOLUME,
  DUCKED_MUSIC_VOLUME,
  FADE_IN_MS,
  FADE_OUT_MS,
  THEME_CUES,
  THEME_TRACK_URL,
  type MusicCueName,
} from "./cues";

/** How often the fade and cue-end timer ticks. */
const TICK_MS = 40;

export interface MusicPlayer {
  play(cue: MusicCueName): void;
  stop(): void;
  duck(): void;
  unduck(): void;
  setEnabled(enabled: boolean): void;
  setVolume(volume: number): void;
}

export class HtmlAudioMusicPlayer implements MusicPlayer {
  #audio: HTMLAudioElement | null = null;
  #enabled = true;
  #baseVolume = DEFAULT_MUSIC_VOLUME;
  #ducked = false;
  #fadeTimer: ReturnType<typeof setInterval> | null = null;
  #stopTimer: ReturnType<typeof setTimeout> | null = null;
  /**
   * Set when a play attempt was refused for want of a user gesture. The next
   * gesture replays it — see `armGestureRetry`.
   */
  #pendingCue: MusicCueName | null = null;
  #gestureArmed = false;

  constructor(private trackUrl: string = THEME_TRACK_URL) {}

  #element(): HTMLAudioElement | null {
    if (typeof Audio === "undefined") return null;
    if (!this.#audio) {
      const audio = new Audio(this.trackUrl);
      audio.preload = "auto";
      // Cues are regions of one file; looping is handled by re-triggering.
      audio.loop = false;
      audio.volume = 0;
      this.#audio = audio;
    }
    return this.#audio;
  }

  /** The volume music should currently sit at, given ducking. */
  #targetVolume() {
    return this.#ducked ? Math.min(DUCKED_MUSIC_VOLUME, this.#baseVolume) : this.#baseVolume;
  }

  #clearTimers() {
    if (this.#fadeTimer) clearInterval(this.#fadeTimer);
    if (this.#stopTimer) clearTimeout(this.#stopTimer);
    this.#fadeTimer = null;
    this.#stopTimer = null;
  }

  /** Ramps volume to `to` over `durationMs`, then optionally pauses. */
  #fade(to: number, durationMs: number, thenPause = false) {
    const audio = this.#element();
    if (!audio) return;

    if (this.#fadeTimer) clearInterval(this.#fadeTimer);
    const from = audio.volume;
    const steps = Math.max(1, Math.round(durationMs / TICK_MS));
    let step = 0;

    this.#fadeTimer = setInterval(() => {
      step++;
      const progress = Math.min(1, step / steps);
      audio.volume = Math.max(0, Math.min(1, from + (to - from) * progress));
      if (progress >= 1) {
        if (this.#fadeTimer) clearInterval(this.#fadeTimer);
        this.#fadeTimer = null;
        if (thenPause) audio.pause();
      }
    }, TICK_MS);
  }

  /**
   * Plays a cue from its start. Calling this while a cue is already playing
   * restarts it, which is what repeated correct answers should do.
   */
  play(cue: MusicCueName) {
    if (!this.#enabled) return;
    const audio = this.#element();
    if (!audio) return;

    const { start, end } = THEME_CUES[cue];
    this.#clearTimers();

    try {
      audio.currentTime = start;
    } catch {
      // Seeking before metadata has loaded throws in some browsers; play from
      // wherever it is rather than failing outright.
    }
    audio.volume = 0;

    const started = () => {
      this.#pendingCue = null;
      this.#fade(this.#targetVolume(), FADE_IN_MS);
      // Stop at the end of the cue, leaving room for the fade.
      const holdMs = Math.max(0, (end - start) * 1000 - FADE_OUT_MS);
      this.#stopTimer = setTimeout(() => this.stop(), holdMs);
    };

    const refused = () => {
      // Browsers refuse audio until the page has had a user gesture. This is
      // expected for the opening cue on a cold start, so remember the cue and
      // play it on the first tap rather than losing it.
      this.#pendingCue = cue;
      this.#armGestureRetry();
    };

    let result: unknown;
    try {
      result = audio.play();
    } catch {
      refused();
      return;
    }

    // `play()` returns a promise in modern browsers, but not in every
    // environment, so both shapes have to be handled.
    if (result && typeof (result as Promise<void>).then === "function") {
      void (result as Promise<void>).then(started, refused);
    } else {
      started();
    }
  }

  /** Fades out and pauses. Safe to call when nothing is playing. */
  stop() {
    const audio = this.#audio;
    this.#clearTimers();
    this.#pendingCue = null;
    if (!audio || audio.paused) return;
    this.#fade(0, FADE_OUT_MS, true);
  }

  /** Drops the volume while something is spoken. */
  duck() {
    this.#ducked = true;
    if (this.#audio && !this.#audio.paused) this.#fade(this.#targetVolume(), 150);
  }

  unduck() {
    this.#ducked = false;
    if (this.#audio && !this.#audio.paused) this.#fade(this.#targetVolume(), 300);
  }

  setEnabled(enabled: boolean) {
    this.#enabled = enabled;
    if (!enabled) {
      this.#pendingCue = null;
      this.stop();
    }
  }

  setVolume(volume: number) {
    this.#baseVolume = Math.max(0, Math.min(1, volume));
    if (this.#audio && !this.#audio.paused) this.#fade(this.#targetVolume(), 150);
  }

  /** Replays a refused cue once the page has had its first user gesture. */
  #armGestureRetry() {
    if (this.#gestureArmed || typeof window === "undefined") return;
    this.#gestureArmed = true;

    const retry = () => {
      window.removeEventListener("pointerdown", retry);
      window.removeEventListener("keydown", retry);
      this.#gestureArmed = false;
      const cue = this.#pendingCue;
      // Only the opening is worth resurrecting: a celebration the learner has
      // already moved past should not surprise them later.
      if (cue === "opening") this.play(cue);
      this.#pendingCue = null;
    };

    window.addEventListener("pointerdown", retry, { once: true });
    window.addEventListener("keydown", retry, { once: true });
  }
}

/** Used on the server, and wherever audio should be inert. */
export class SilentMusicPlayer implements MusicPlayer {
  play() {}
  stop() {}
  duck() {}
  unduck() {}
  setEnabled() {}
  setVolume() {}
}

let instance: MusicPlayer | null = null;

/** Process-wide player, so a cue can be stopped from anywhere. */
export function getMusicPlayer(): MusicPlayer {
  instance ??=
    typeof window === "undefined" ? new SilentMusicPlayer() : new HtmlAudioMusicPlayer();
  return instance;
}
