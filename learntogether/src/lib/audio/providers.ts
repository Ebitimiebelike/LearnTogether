/**
 * Speech providers.
 *
 * The MVP speaks with the device's speech synthesis, but every call goes
 * through this interface. Dropping professionally recorded audio into
 * `public/audio/...` and setting `LearningItem.audio` is enough to switch over:
 * `RecordedAudioProvider` is tried first and only falls through when a clip is
 * missing or fails to play.
 */

export interface SpeechRequest {
  /** Text to speak when no recording is available. */
  text: string;
  /** Optional path to a local audio file, e.g. "/audio/letters/a.mp3". */
  audioUrl?: string;
  /** Speaking rate. Below 1 is slower, which suits early learners. */
  rate?: number;
}

export interface SpeechProvider {
  isAvailable(): boolean;
  speak(request: SpeechRequest): Promise<void>;
  cancel(): void;
}

/** Plays a prerecorded clip. Rejects when there is no clip for this request. */
export class RecordedAudioProvider implements SpeechProvider {
  #current: HTMLAudioElement | null = null;

  isAvailable() {
    return typeof Audio !== "undefined";
  }

  speak({ audioUrl }: SpeechRequest) {
    if (!audioUrl) return Promise.reject(new Error("no recording"));
    this.cancel();
    return new Promise<void>((resolve, reject) => {
      const audio = new Audio(audioUrl);
      this.#current = audio;
      audio.onended = () => resolve();
      audio.onerror = () => reject(new Error(`cannot play ${audioUrl}`));
      audio.play().catch(reject);
    });
  }

  cancel() {
    this.#current?.pause();
    this.#current = null;
  }
}

/** Speaks using the browser's built-in voice. */
export class SpeechSynthesisProvider implements SpeechProvider {
  isAvailable() {
    return (
      typeof window !== "undefined" &&
      typeof window.speechSynthesis !== "undefined" &&
      typeof window.SpeechSynthesisUtterance !== "undefined"
    );
  }

  speak({ text, rate = 0.85 }: SpeechRequest) {
    if (!this.isAvailable()) return Promise.reject(new Error("no synthesis"));
    this.cancel();
    return new Promise<void>((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = rate;
      utterance.pitch = 1;
      utterance.lang = "en-US";
      utterance.onend = () => resolve();
      utterance.onerror = () => reject(new Error("synthesis failed"));
      window.speechSynthesis.speak(utterance);
    });
  }

  cancel() {
    if (this.isAvailable()) window.speechSynthesis.cancel();
  }
}

/** Tries each provider in order and resolves with the first that succeeds. */
export class FallbackSpeechProvider implements SpeechProvider {
  constructor(private providers: SpeechProvider[]) {}

  isAvailable() {
    return this.providers.some((provider) => provider.isAvailable());
  }

  async speak(request: SpeechRequest) {
    for (const provider of this.providers) {
      if (!provider.isAvailable()) continue;
      try {
        await provider.speak(request);
        return;
      } catch {
        // Try the next provider. Silence is an acceptable outcome: the UI never
        // depends on audio having played.
      }
    }
  }

  cancel() {
    for (const provider of this.providers) provider.cancel();
  }
}
