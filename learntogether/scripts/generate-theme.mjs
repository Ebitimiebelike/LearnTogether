/**
 * Generates the default theme track at `public/audio/theme.wav`.
 *
 * This exists so the music feature ships working and testable without bundling
 * anyone's copyrighted recording. It is a synthesised 90s-eurodance-style
 * instrumental at 138 BPM over an A minor / F / C / G progression, written as
 * two cues laid end to end:
 *
 *   bars 0-1  "opening"     ~3.5s  — a riser and a chord swell for app launch
 *   bars 2-7  "celebration" ~10.4s — the full-arrangement hook, for a correct answer
 *
 * The cue boundaries are declared in `src/lib/audio/cues.ts`. To use your own
 * music, replace `public/audio/theme.wav` (an .mp3 is fine — update
 * `THEME_TRACK_URL`) and set the cue times to wherever your intro and chorus
 * actually start. No other code changes.
 *
 * Run with `npm run theme`. The output is committed, so this is not part of a
 * build.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "audio");

const SAMPLE_RATE = 32000;
const BPM = 138;
const BEAT = 60 / BPM;
const BAR = BEAT * 4;

const OPENING_BARS = 2;
const CELEBRATION_BARS = 6;
const TOTAL_BARS = OPENING_BARS + CELEBRATION_BARS;
const TOTAL_SAMPLES = Math.round(BAR * TOTAL_BARS * SAMPLE_RATE);

const track = new Float32Array(TOTAL_SAMPLES);

/** Seeded noise, so regenerating produces a byte-identical file. */
let noiseState = 0x2f6e2b1;
function noise() {
  noiseState = (noiseState * 1664525 + 1013904223) >>> 0;
  return (noiseState / 0xffffffff) * 2 - 1;
}

function add(index, value) {
  if (index >= 0 && index < TOTAL_SAMPLES) track[index] += value;
}

const SEMITONES = { C: 0, "C#": 1, D: 2, "D#": 3, E: 4, F: 5, "F#": 6, G: 7, "G#": 8, A: 9, "A#": 10, B: 11 };

/** "A4" -> 440. */
function freq(name) {
  const match = /^([A-G]#?)(\d)$/.exec(name);
  const midi = SEMITONES[match[1]] + (Number(match[2]) + 1) * 12;
  return 440 * 2 ** ((midi - 69) / 12);
}

/** Sums the first `count` harmonics: a cheap band-limited sawtooth. */
function saw(hz, t, count) {
  let value = 0;
  for (let harmonic = 1; harmonic <= count; harmonic++) {
    const partial = hz * harmonic;
    if (partial > SAMPLE_RATE / 2.2) break;
    value += Math.sin(2 * Math.PI * partial * t) / harmonic;
  }
  return value;
}

/** Odd harmonics only: a cheap band-limited square, for bass and lead. */
function square(hz, t, count) {
  let value = 0;
  for (let harmonic = 1; harmonic <= count; harmonic += 2) {
    const partial = hz * harmonic;
    if (partial > SAMPLE_RATE / 2.2) break;
    value += Math.sin(2 * Math.PI * partial * t) / harmonic;
  }
  return value;
}

function kick(atSeconds, gain = 1) {
  const start = Math.round(atSeconds * SAMPLE_RATE);
  const length = Math.round(0.3 * SAMPLE_RATE);
  let phase = 0;
  for (let i = 0; i < length; i++) {
    const t = i / SAMPLE_RATE;
    // Pitch drops fast from a click to a low thump.
    const hz = 46 + 130 * Math.exp(-t * 42);
    phase += (2 * Math.PI * hz) / SAMPLE_RATE;
    add(start + i, Math.sin(phase) * Math.exp(-t * 13) * gain);
  }
}

function hat(atSeconds, gain, decay) {
  const start = Math.round(atSeconds * SAMPLE_RATE);
  const length = Math.round(0.09 * SAMPLE_RATE);
  for (let i = 0; i < length; i++) {
    const t = i / SAMPLE_RATE;
    add(start + i, noise() * Math.exp(-t * decay) * gain);
  }
}

function stab(atSeconds, chord, gain) {
  const start = Math.round(atSeconds * SAMPLE_RATE);
  const length = Math.round(0.24 * SAMPLE_RATE);
  for (let i = 0; i < length; i++) {
    const t = i / SAMPLE_RATE;
    // Fast attack, short decay: the classic offbeat eurodance stab.
    const envelope = Math.exp(-t * 15) * (1 - Math.exp(-t * 500));
    let value = 0;
    for (const hz of chord) value += saw(hz, t, 7);
    add(start + i, (value / chord.length) * envelope * gain);
  }
}

function bass(atSeconds, hz, seconds, gain) {
  const start = Math.round(atSeconds * SAMPLE_RATE);
  const length = Math.round(seconds * SAMPLE_RATE);
  for (let i = 0; i < length; i++) {
    const t = i / SAMPLE_RATE;
    const envelope = Math.exp(-t * 7) * (1 - Math.exp(-t * 900));
    add(start + i, square(hz, t, 5) * envelope * gain);
  }
}

function lead(atSeconds, hz, seconds, gain) {
  const start = Math.round(atSeconds * SAMPLE_RATE);
  const length = Math.round(seconds * SAMPLE_RATE);
  for (let i = 0; i < length; i++) {
    const t = i / SAMPLE_RATE;
    const envelope = Math.exp(-t * 5) * (1 - Math.exp(-t * 700));
    add(start + i, square(hz, t, 7) * envelope * gain);
  }
}

/** A slow-swelling chord bed, used under the opening. */
function pad(atSeconds, chord, seconds, gain) {
  const start = Math.round(atSeconds * SAMPLE_RATE);
  const length = Math.round(seconds * SAMPLE_RATE);
  for (let i = 0; i < length; i++) {
    const t = i / SAMPLE_RATE;
    const progress = i / length;
    // Swell in, then ease away, so the opening never ends on a hard edge.
    const envelope = Math.sin(Math.PI * progress) ** 0.7;
    let value = 0;
    for (const hz of chord) value += saw(hz, t, 5);
    add(start + i, (value / chord.length) * envelope * gain);
  }
}

/** A rising noise sweep announcing the app opening. */
function riser(atSeconds, seconds, gain) {
  const start = Math.round(atSeconds * SAMPLE_RATE);
  const length = Math.round(seconds * SAMPLE_RATE);
  let filtered = 0;
  for (let i = 0; i < length; i++) {
    const progress = i / length;
    // A one-pole low-pass whose cutoff opens as the sweep rises.
    const cutoff = 0.02 + 0.5 * progress ** 2;
    filtered += cutoff * (noise() - filtered);
    add(start + i, filtered * progress ** 2 * gain);
  }
}

const AM = ["A3", "C4", "E4"].map(freq);
const F = ["F3", "A3", "C4"].map(freq);
const C = ["C4", "E4", "G4"].map(freq);
const G = ["G3", "B3", "D4"].map(freq);

// ---------------------------------------------------------------------------
// Opening: bars 0-1. Plays alone at launch, so it has to feel complete.
// ---------------------------------------------------------------------------
riser(0, BAR * 1.9, 0.5);
pad(0, AM, BAR * 2, 0.34);

for (let beat = 0; beat < 4; beat++) {
  // Half-time kick in the first bar, full four-on-the-floor in the second.
  if (beat % 2 === 0) kick(beat * BEAT, 0.7);
  kick(BAR + beat * BEAT, 0.95);
  hat(BAR + beat * BEAT + BEAT * 0.5, 0.14, 70);
  bass(BAR + beat * BEAT, freq("A2"), BEAT * 0.6, 0.45);
  stab(BAR + beat * BEAT + BEAT * 0.5, AM, 0.36);
}
// A short fill on the last beat, leading into the hook.
for (let i = 0; i < 4; i++) {
  hat(BAR + 3 * BEAT + i * (BEAT / 4), 0.1 + i * 0.03, 120);
}

// ---------------------------------------------------------------------------
// Celebration: bars 2-7. The full hook, played on a correct answer.
// ---------------------------------------------------------------------------
const CELEBRATION_START_BAR = OPENING_BARS;

/** One entry per celebration bar: chord, bass root, and eight eighth-notes. */
const HOOK = [
  { chord: AM, root: "A2", melody: ["A4", null, "C5", "E5", null, "D5", "C5", "A4"] },
  { chord: F, root: "F2", melody: ["F4", null, "A4", "C5", null, "C5", "A4", "F4"] },
  { chord: C, root: "C3", melody: ["E4", null, "G4", "C5", null, "B4", "G4", "E4"] },
  { chord: G, root: "G2", melody: ["D4", null, "G4", "B4", null, "D5", "B4", "G4"] },
  { chord: AM, root: "A2", melody: ["E5", null, "E5", "D5", null, "C5", "B4", "C5"] },
  { chord: G, root: "G2", melody: ["D5", null, "B4", "G4", null, "A4", "B4", "D5"] },
];

HOOK.forEach((bar, index) => {
  const barStart = (CELEBRATION_START_BAR + index) * BAR;

  for (let beat = 0; beat < 4; beat++) {
    const beatAt = barStart + beat * BEAT;

    kick(beatAt, 0.95);
    bass(beatAt, freq(bar.root), BEAT * 0.6, 0.5);
    bass(beatAt + BEAT * 0.5, freq(bar.root), BEAT * 0.35, 0.28);

    hat(beatAt + BEAT * 0.25, 0.05, 150);
    hat(beatAt + BEAT * 0.5, 0.16, 70);
    stab(beatAt + BEAT * 0.5, bar.chord, 0.42);
  }

  bar.melody.forEach((note, eighth) => {
    if (!note) return;
    lead(barStart + eighth * (BEAT / 2), freq(note), BEAT * 0.45, 0.22);
  });
});

// Normalise with headroom, then soft-clip anything that still peaks.
let peak = 0;
for (const sample of track) peak = Math.max(peak, Math.abs(sample));
const scale = peak > 0 ? 0.82 / peak : 1;
for (let i = 0; i < track.length; i++) {
  track[i] = Math.tanh(track[i] * scale * 1.1);
}

/** Encodes mono 16-bit PCM as a RIFF/WAVE file. */
function encodeWav(samples, sampleRate) {
  const dataBytes = samples.length * 2;
  const buffer = Buffer.alloc(44 + dataBytes);

  buffer.write("RIFF", 0, "ascii");
  buffer.writeUInt32LE(36 + dataBytes, 4);
  buffer.write("WAVE", 8, "ascii");

  buffer.write("fmt ", 12, "ascii");
  buffer.writeUInt32LE(16, 16); // fmt chunk size
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(1, 22); // mono
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28); // byte rate
  buffer.writeUInt16LE(2, 32); // block align
  buffer.writeUInt16LE(16, 34); // bits per sample

  buffer.write("data", 36, "ascii");
  buffer.writeUInt32LE(dataBytes, 40);

  for (let i = 0; i < samples.length; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    buffer.writeInt16LE(Math.round(clamped * 32767), 44 + i * 2);
  }

  return buffer;
}

mkdirSync(OUT_DIR, { recursive: true });
const wav = encodeWav(track, SAMPLE_RATE);
writeFileSync(join(OUT_DIR, "theme.wav"), wav);

console.log(`wrote public/audio/theme.wav — ${(wav.length / 1024).toFixed(0)} KB`);
console.log(`  opening cue:     0.000s -> ${(BAR * OPENING_BARS).toFixed(3)}s`);
console.log(
  `  celebration cue: ${(BAR * OPENING_BARS).toFixed(3)}s -> ${(BAR * TOTAL_BARS).toFixed(3)}s`,
);
