/**
 * The single audio entry point for the app.
 *
 * Components never touch speech synthesis or the Web Audio API directly; they
 * call these methods. Audio is always best-effort — every method resolves even
 * when the device cannot speak, so no screen can be blocked by missing audio.
 */
import type { LearningItem } from "@/types";
import { SilentEffects, WebAudioEffects, type SoundEffects } from "./effects";
import { getMusicPlayer, type MusicPlayer } from "./MusicService";
import {
  FallbackSpeechProvider,
  RecordedAudioProvider,
  SpeechSynthesisProvider,
  type SpeechProvider,
} from "./providers";

export interface AudioPreferences {
  audioEnabled: boolean;
  soundEffectsEnabled: boolean;
  musicEnabled: boolean;
}

const DEFAULT_PREFERENCES: AudioPreferences = {
  audioEnabled: true,
  soundEffectsEnabled: true,
  musicEnabled: true,
};

export class AudioService {
  #preferences: AudioPreferences = DEFAULT_PREFERENCES;

  constructor(
    private speech: SpeechProvider = new FallbackSpeechProvider([
      new RecordedAudioProvider(),
      new SpeechSynthesisProvider(),
    ]),
    private effects: SoundEffects = typeof window === "undefined"
      ? new SilentEffects()
      : new WebAudioEffects(),
    private music: MusicPlayer = getMusicPlayer(),
  ) {}

  setPreferences(preferences: AudioPreferences) {
    this.#preferences = preferences;
    if (!preferences.audioEnabled) this.speech.cancel();
    this.music.setEnabled(preferences.musicEnabled);
  }

  /** True when the device can speak at all. The UI uses this to explain silence. */
  isSpeechAvailable() {
    return this.speech.isAvailable();
  }

  async #say(text: string, audioUrl?: string, rate?: number) {
    if (!this.#preferences.audioEnabled) return;
    // Spoken instructions are the app's primary channel, so music always gets
    // out of their way — including the celebration hook playing underneath.
    this.music.duck();
    try {
      await this.speech.speak({ text, audioUrl, rate });
    } catch {
      // Never let a failed utterance surface as an error to the learner.
    } finally {
      this.music.unduck();
    }
  }

  /** "A" — the letter name. */
  speakLetter(letter: string, audioUrl?: string) {
    return this.#say(letter.toUpperCase(), audioUrl);
  }

  /** "Three" — the number word, which is clearer than the digit. */
  speakNumber(value: number | string, audioUrl?: string) {
    return this.#say(String(value), audioUrl);
  }

  /** Speaks whichever form suits the item's category. */
  speakItem(item: LearningItem) {
    return item.category === "number"
      ? this.speakNumber(item.writtenWord ?? item.value, item.audio)
      : this.speakLetter(item.value, item.audio);
  }

  /** "A says ah." */
  speakSoundHint(item: LearningItem) {
    return this.#say(item.soundHint ?? item.value);
  }

  /** Any spoken instruction, e.g. "Find A." */
  speakInstruction(text: string) {
    return this.#say(text, undefined, 0.8);
  }

  stop() {
    this.speech.cancel();
  }

  /**
   * A correct answer. Plays the short chime and, when music is on, launches the
   * celebration hook underneath it.
   *
   * Every success path in the app already calls this, so it is the one place
   * the reward music needs to be triggered from.
   */
  playSuccess() {
    if (this.#preferences.soundEffectsEnabled) this.effects.playSuccess();
    if (this.#preferences.musicEnabled) this.music.play("celebration");
  }

  playTryAgain() {
    if (this.#preferences.soundEffectsEnabled) this.effects.playTryAgain();
  }

  /** The flourish played once when the app opens. */
  playOpeningTheme() {
    if (this.#preferences.musicEnabled) this.music.play("opening");
  }

  /**
   * Cuts the music short — used when the learner moves on, so the hook is a
   * reward they can walk away from rather than something to sit through.
   */
  stopMusic() {
    this.music.stop();
  }
}

let instance: AudioService | null = null;

/** Process-wide instance so speech can be cancelled across screens. */
export function getAudioService(): AudioService {
  instance ??= new AudioService();
  return instance;
}

