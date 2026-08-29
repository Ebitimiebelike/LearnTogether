/**
 * The tracing catalogue.
 *
 * `getTraceable` is the single lookup used by every tracing screen, so adding a
 * new traceable category means adding a case here.
 */
import { LOWERCASE_STROKES, UPPERCASE_STROKES } from "./letters";
import { NUMBER_STROKES } from "./numbers";

export type TraceCase = "uppercase" | "lowercase";

export interface Traceable {
  /** The character shown and spoken, e.g. "A", "a" or "3". */
  character: string;
  /** Ordered strokes, in the 0–100 tracing coordinate space. */
  strokes: string[];
}

export function getLetterTrace(
  letter: string,
  letterCase: TraceCase,
): Traceable | undefined {
  const strokes =
    letterCase === "uppercase"
      ? UPPERCASE_STROKES[letter.toUpperCase()]
      : LOWERCASE_STROKES[letter.toLowerCase()];
  if (!strokes) return undefined;
  return {
    character:
      letterCase === "uppercase" ? letter.toUpperCase() : letter.toLowerCase(),
    strokes,
  };
}

export function getNumberTrace(value: string | number): Traceable | undefined {
  const character = String(value);
  const strokes = NUMBER_STROKES[character];
  return strokes ? { character, strokes } : undefined;
}

export { UPPERCASE_STROKES, LOWERCASE_STROKES, NUMBER_STROKES };
export * from "./shapes";
