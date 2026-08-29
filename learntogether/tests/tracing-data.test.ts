import { describe, expect, it } from "vitest";
import { samplePath } from "@/lib/geometry/path";
import {
  LOWERCASE_STROKES,
  NUMBER_STROKES,
  UPPERCASE_STROKES,
  getLetterTrace,
  getNumberTrace,
} from "@/data/tracing";
import { ALPHABET } from "@/data/alphabet";
import { NUMBERS } from "@/data/numbers";

/** Strokes must stay inside the 0-100 tracing square or they get clipped. */
function bounds(strokes: string[]) {
  const points = strokes.flatMap((stroke) => samplePath(stroke, 30));
  return {
    minX: Math.min(...points.map((p) => p.x)),
    maxX: Math.max(...points.map((p) => p.x)),
    minY: Math.min(...points.map((p) => p.y)),
    maxY: Math.max(...points.map((p) => p.y)),
  };
}

const ALL: [string, Record<string, string[]>][] = [
  ["uppercase", UPPERCASE_STROKES],
  ["lowercase", LOWERCASE_STROKES],
  ["numbers", NUMBER_STROKES],
];

describe.each(ALL)("%s stroke data", (_label, table) => {
  it.each(Object.keys(table))("'%s' parses and fits the canvas", (character) => {
    const strokes = table[character];
    expect(strokes.length).toBeGreaterThan(0);

    const box = bounds(strokes);
    expect(box.minX).toBeGreaterThanOrEqual(0);
    expect(box.maxX).toBeLessThanOrEqual(100);
    expect(box.minY).toBeGreaterThanOrEqual(0);
    expect(box.maxY).toBeLessThanOrEqual(100);

    // A character that occupied a sliver of the canvas would be unusable.
    expect(box.maxY - box.minY).toBeGreaterThan(20);
  });
});

describe("tracing coverage of the lesson content", () => {
  it("has uppercase and lowercase strokes for every letter lesson", () => {
    for (const item of ALPHABET) {
      expect(getLetterTrace(item.value, "uppercase")).toBeDefined();
      expect(getLetterTrace(item.value, "lowercase")).toBeDefined();
    }
  });

  it("has strokes for every number lesson, 0 to 20", () => {
    expect(NUMBERS).toHaveLength(21);
    for (const item of NUMBERS) {
      expect(getNumberTrace(item.value)).toBeDefined();
    }
  });

  it("builds two-digit numbers from two digits' worth of strokes", () => {
    // 11 is two 1s, so two strokes; 10 is a 1 and a 0, so two as well.
    expect(NUMBER_STROKES["11"]).toHaveLength(2);
    expect(NUMBER_STROKES["18"]).toHaveLength(
      NUMBER_STROKES["1"].length + NUMBER_STROKES["8"].length,
    );
  });

  it("returns undefined for characters with no stroke data", () => {
    expect(getLetterTrace("!", "uppercase")).toBeUndefined();
    expect(getNumberTrace(99)).toBeUndefined();
  });
});
