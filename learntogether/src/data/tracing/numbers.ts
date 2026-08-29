/**
 * Stroke data for tracing numbers 0–20.
 *
 * Only the ten digits are authored by hand. Two-digit numbers are composed by
 * scaling and shifting those same strokes, so 21–99 would need no new data.
 */
import { transformPath } from "@/lib/geometry/path";
import { oval } from "./shapes";

export const DIGIT_STROKES: Record<string, string[]> = {
  "0": [oval(50, 50, 20, 35)],
  "1": ["M36 30 L50 18 L50 85"],
  "2": ["M32 30 C34 14 66 12 68 30 C70 44 50 56 32 85 L70 85"],
  "3": [
    "M32 26 C36 12 66 14 66 30 C66 42 54 48 46 48 C56 48 70 54 70 68 C70 86 38 90 32 74",
  ],
  "4": ["M58 18 L28 62 L72 62", "M58 18 L58 85"],
  "5": ["M68 18 L36 18 L34 46 C48 40 70 44 70 64 C70 84 42 92 32 76"],
  // A curve in from the top right, then the closing loop.
  "6": ["M64 20 C44 24 32 44 32 62", oval(50, 64, 18, 21)],
  "7": ["M30 18 L70 18", "M70 18 L44 85"],
  // Two stacked loops: easier to follow with a finger than a single figure-eight.
  "8": [oval(50, 33, 16, 17), oval(50, 65, 19, 20)],
  "9": [oval(50, 38, 18, 21), "M68 38 C68 60 66 74 56 86"],
};

/**
 * Places a digit's strokes into one half of the tracing square.
 *
 * Digits are drawn in x∈[28,72], y∈[15,85] around centre (50,50). Scaling by
 * 0.8 and re-centring puts the tens digit at x≈30 and the units digit at x≈70.
 */
const TWO_DIGIT_SCALE = 0.8;
const TENS_OFFSET_X = -10;
const UNITS_OFFSET_X = 30;
const TWO_DIGIT_OFFSET_Y = 10;

function twoDigitStrokes(value: number): string[] {
  const [tens, units] = String(value).split("");
  return [
    ...DIGIT_STROKES[tens].map((stroke) =>
      transformPath(stroke, TWO_DIGIT_SCALE, TENS_OFFSET_X, TWO_DIGIT_OFFSET_Y),
    ),
    ...DIGIT_STROKES[units].map((stroke) =>
      transformPath(stroke, TWO_DIGIT_SCALE, UNITS_OFFSET_X, TWO_DIGIT_OFFSET_Y),
    ),
  ];
}

export const NUMBER_STROKES: Record<string, string[]> = Object.fromEntries(
  Array.from({ length: 21 }, (_, value) => [
    String(value),
    value < 10 ? DIGIT_STROKES[String(value)] : twoDigitStrokes(value),
  ]),
);

