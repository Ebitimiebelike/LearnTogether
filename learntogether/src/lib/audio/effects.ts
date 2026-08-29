/**
 * Short reward / retry sounds, synthesised with the Web Audio API.
 *
 * Generating them means there are no audio files to download, so effects work
 * offline from the very first load. They are deliberately soft and short, and
 * never startling.
 */

export interface SoundEffects {
  playSuccess(): void;
  playTryAgain(): void;
}

type Note = { frequency: number; startAt: number; duration: number };

/** A gentle rising major arpeggio. */
const SUCCESS: Note[] = [
  { frequency: 523.25, startAt: 0, duration: 0.16 }, // C5
  { frequency: 659.25, startAt: 0.12, duration: 0.16 }, // E5
  { frequency: 783.99, startAt: 0.24, duration: 0.28 }, // G5
];

/** Two soft, level notes. Encouraging rather than a buzzer. */
const TRY_AGAIN: Note[] = [
  { frequency: 392.0, startAt: 0, duration: 0.16 }, // G4
  { frequency: 440.0, startAt: 0.14, duration: 0.2 }, // A4
];

export class WebAudioEffects implements SoundEffects {
  #context: AudioContext | null = null;

  #ensureContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return null;
    this.#context ??= new Ctor();
    // Browsers start the context suspended until a user gesture; every effect
    // here is played in response to a tap, so resuming is safe.
    if (this.#context.state === "suspended") void this.#context.resume();
    return this.#context;
  }

  #play(notes: Note[], peakGain: number) {
    const context = this.#ensureContext();
    if (!context) return;
    const now = context.currentTime;
    for (const note of notes) {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = note.frequency;
      // Ramp in and out so there is no click, which can be startling.
      const start = now + note.startAt;
      const end = start + note.duration;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(peakGain, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, end);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(start);
      oscillator.stop(end + 0.02);
    }
  }

  playSuccess() {
    this.#play(SUCCESS, 0.18);
  }

  playTryAgain() {
    this.#play(TRY_AGAIN, 0.12);
  }
}

/** Used when the Web Audio API is missing, and in tests. */
export class SilentEffects implements SoundEffects {
  playSuccess() {}
  playTryAgain() {}
}
