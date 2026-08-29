/**
 * Stroke data for tracing letters.
 *
 * Each character is a list of strokes, in the order they should be written.
 * Every stroke starts where the learner should place their finger, so the
 * component can put the start dot and the direction arrow on it without any
 * extra data.
 *
 * Deliberately kept separate from the tracing component: adding shapes or
 * whole words later means adding entries here, not changing the canvas.
 */
import { arc, bowlClockwise, bowlCounterClockwise, oval } from "./shapes";

export const UPPERCASE_STROKES: Record<string, string[]> = {
  A: ["M28 85 L50 15", "M50 15 L72 85", "M36 62 L64 62"],
  B: [
    "M32 15 L32 85",
    "M32 15 L54 15 C68 15 68 48 54 48 L32 48",
    "M32 48 L57 48 C72 48 72 85 57 85 L32 85",
  ],
  C: [arc(50, 50, 22, 35, -40, -320)],
  D: ["M32 15 L32 85", "M32 15 L50 15 C72 15 72 85 50 85 L32 85"],
  E: ["M32 15 L32 85", "M32 15 L68 15", "M32 50 L62 50", "M32 85 L68 85"],
  F: ["M32 15 L32 85", "M32 15 L68 15", "M32 50 L62 50"],
  G: [`${arc(50, 50, 22, 35, -40, -330)} L69 55 L55 55`],
  H: ["M32 15 L32 85", "M68 15 L68 85", "M32 50 L68 50"],
  I: ["M50 15 L50 85", "M36 15 L64 15", "M36 85 L64 85"],
  J: ["M60 15 L60 68 C60 86 36 88 33 70"],
  K: ["M32 15 L32 85", "M68 16 L34 52", "M45 43 L68 85"],
  L: ["M34 15 L34 85", "M34 85 L68 85"],
  M: ["M30 85 L30 15", "M30 15 L50 58 L70 15", "M70 15 L70 85"],
  N: ["M32 85 L32 15", "M32 15 L68 85", "M68 85 L68 15"],
  O: [oval(50, 50, 22, 35)],
  P: ["M32 15 L32 85", "M32 15 L55 15 C70 15 70 50 55 50 L32 50"],
  Q: [oval(50, 50, 22, 35), "M58 66 L76 90"],
  R: [
    "M32 15 L32 85",
    "M32 15 L55 15 C69 15 69 48 55 48 L32 48",
    "M46 48 L70 85",
  ],
  S: [
    "M68 28 C64 14 36 12 34 30 C32 44 50 49 60 55 C72 62 70 84 50 85 C40 85 34 80 32 72",
  ],
  T: ["M28 15 L72 15", "M50 15 L50 85"],
  U: ["M32 15 L32 60 C32 84 68 84 68 60 L68 15"],
  V: ["M30 15 L50 85", "M50 85 L70 15"],
  W: ["M26 15 L38 85", "M38 85 L50 40", "M50 40 L62 85", "M62 85 L74 15"],
  X: ["M30 15 L70 85", "M70 15 L30 85"],
  Y: ["M30 15 L50 50", "M70 15 L50 50", "M50 50 L50 85"],
  Z: ["M30 15 L70 15", "M70 15 L30 85", "M30 85 L68 85"],
};

export const LOWERCASE_STROKES: Record<string, string[]> = {
  a: [arc(48, 65, 14, 20, -25, -335), "M62 45 L62 85"],
  b: ["M34 15 L34 85", bowlClockwise(50, 66, 16, 19)],
  c: [arc(50, 65, 16, 20, -40, -320)],
  d: [bowlCounterClockwise(50, 66, 16, 19), "M66 15 L66 85"],
  e: [
    "M35 66 L65 66 C67 52 52 43 42 52 C30 62 32 82 46 85 C55 87 62 83 66 76",
  ],
  f: ["M62 22 C62 12 46 12 46 26 L46 85", "M36 48 L58 48"],
  g: [oval(50, 65, 16, 20), "M66 45 L66 86 C66 96 46 98 40 90"],
  h: ["M34 15 L34 85", "M34 60 C38 47 58 44 64 55 C66 59 66 63 66 68 L66 85"],
  i: ["M50 47 L50 85", "M50 28 L50 34"],
  j: ["M56 47 L56 86 C56 96 40 98 34 90", "M56 28 L56 34"],
  k: ["M34 15 L34 85", "M62 47 L36 68", "M45 61 L64 85"],
  l: ["M50 15 L50 85"],
  m: [
    "M32 47 L32 85",
    "M32 58 C36 46 50 46 51 58 L51 85",
    "M51 58 C55 46 69 46 70 58 L70 85",
  ],
  n: ["M34 47 L34 85", "M34 58 C38 46 62 44 66 58 L66 85"],
  o: [oval(50, 65, 16, 20)],
  p: ["M34 47 L34 97", bowlClockwise(50, 66, 16, 19)],
  q: [bowlCounterClockwise(50, 66, 16, 19), "M66 47 L66 97"],
  r: ["M36 47 L36 85", "M36 60 C40 48 54 44 64 48"],
  s: [
    "M64 54 C60 44 40 43 38 53 C36 62 52 64 60 70 C68 76 62 88 46 85 C41 84 38 81 36 77",
  ],
  t: ["M48 25 L48 76 C48 84 58 86 62 80", "M36 47 L60 47"],
  u: ["M34 47 L34 72 C34 86 58 88 64 74 L64 47", "M64 47 L64 85"],
  v: ["M34 47 L50 85", "M50 85 L66 47"],
  w: ["M30 47 L40 85", "M40 85 L50 56", "M50 56 L60 85", "M60 85 L70 47"],
  x: ["M34 47 L66 85", "M66 47 L34 85"],
  y: ["M34 47 L50 82", "M66 47 L46 97"],
  z: ["M34 47 L66 47", "M66 47 L34 85", "M34 85 L66 85"],
};
