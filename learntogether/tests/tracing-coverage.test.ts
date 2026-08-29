import { describe, expect, it } from "vitest";
import {
  computeCoverage,
  DEFAULT_TOLERANCE,
  evaluateTrace,
  guidePoints,
  PASS_THRESHOLD,
} from "@/features/tracing/coverage";
import { samplePath, type Point } from "@/lib/geometry/path";
import { getLetterTrace } from "@/data/tracing";

/** Traces a stroke perfectly, at the density a finger would produce. */
function perfectTrace(strokes: string[]): Point[] {
  return strokes.flatMap((stroke) => samplePath(stroke, 120));
}

describe("computeCoverage", () => {
  const targets = samplePath("M10 10 L90 10", 20);

  it("is 1 when every guide point is touched", () => {
    expect(computeCoverage(targets, samplePath("M10 10 L90 10", 200))).toBe(1);
  });

  it("is 0 when nothing is drawn", () => {
    expect(computeCoverage(targets, [])).toBe(0);
  });

  it("is 0 when the drawing is nowhere near the guide", () => {
    expect(computeCoverage(targets, samplePath("M10 90 L90 90", 200))).toBe(0);
  });

  it("is about half when half the guide is traced", () => {
    const coverage = computeCoverage(targets, samplePath("M10 10 L50 10", 100));
    // Slightly over half: the tolerance reaches one radius beyond where the
    // finger stopped, which is the intended leniency rather than a rounding
    // artefact.
    expect(coverage).toBeGreaterThan(0.45);
    expect(coverage).toBeLessThan(0.7);
  });

  it("forgives a wobble inside the tolerance", () => {
    // A line drawn 8 units below the guide, well within the 12-unit tolerance.
    expect(computeCoverage(targets, samplePath("M10 18 L90 18", 200))).toBe(1);
  });

  it("does not credit a line drawn outside the tolerance", () => {
    expect(computeCoverage(targets, samplePath("M10 40 L90 40", 200))).toBe(0);
  });

  it("respects a custom tolerance", () => {
    const drawn = samplePath("M10 25 L90 25", 200);
    expect(computeCoverage(targets, drawn, 5)).toBe(0);
    expect(computeCoverage(targets, drawn, 20)).toBe(1);
  });

  it("returns 0 rather than dividing by zero for an empty guide", () => {
    expect(computeCoverage([], samplePath("M0 0 L10 10", 10))).toBe(0);
  });
});

describe("guidePoints", () => {
  it("samples every stroke", () => {
    const strokes = getLetterTrace("A", "uppercase")!.strokes;
    expect(guidePoints(strokes).length).toBe(strokes.length * 40);
  });
});

describe("evaluateTrace", () => {
  const traceA = getLetterTrace("A", "uppercase")!;

  it("passes and praises a good trace", () => {
    const result = evaluateTrace(traceA.strokes, perfectTrace(traceA.strokes), "A");
    expect(result.coverage).toBe(1);
    expect(result.passed).toBe(true);
    expect(result.message).toBe("Great job tracing A!");
  });

  it("passes a partial but genuine attempt", () => {
    // Two of A's three strokes traced: above the lenient 50% threshold.
    const partial = perfectTrace(traceA.strokes.slice(0, 2));
    const result = evaluateTrace(traceA.strokes, partial, "A");
    expect(result.coverage).toBeGreaterThan(PASS_THRESHOLD);
    expect(result.passed).toBe(true);
  });

  it("encourages rather than criticises a poor attempt", () => {
    const result = evaluateTrace(traceA.strokes, samplePath("M2 2 L4 4", 20), "A");
    expect(result.passed).toBe(false);
    expect(result.message).toMatch(/Good try|Follow the dots/);
    // Nothing in the feedback should read as a failure.
    expect(result.message).not.toMatch(/wrong|bad|incorrect|failed/i);
  });

  it("prompts to start when nothing has been drawn", () => {
    expect(evaluateTrace(traceA.strokes, [], "A").message).toBe(
      "Follow the dots to trace A.",
    );
  });

  it("names the character being traced", () => {
    const traceSeven = getLetterTrace("Z", "lowercase")!;
    const result = evaluateTrace(
      traceSeven.strokes,
      perfectTrace(traceSeven.strokes),
      "z",
    );
    expect(result.message).toContain("z");
  });

  it("is lenient enough that every character can be passed", () => {
    // A learner tracing each guide reasonably must always be able to succeed.
    for (const letter of ["A", "M", "S", "W", "Q"]) {
      for (const letterCase of ["uppercase", "lowercase"] as const) {
        const trace = getLetterTrace(letter, letterCase)!;
        // Simulates a shaky finger: every point nudged off the guide.
        const wobbly = perfectTrace(trace.strokes).map((point, index) => ({
          x: point.x + (index % 2 === 0 ? 4 : -4),
          y: point.y + (index % 3 === 0 ? 4 : -3),
        }));
        const result = evaluateTrace(trace.strokes, wobbly, trace.character);
        expect(
          result.passed,
          `${trace.character} should pass with a wobbly trace (coverage ${result.coverage})`,
        ).toBe(true);
      }
    }
  });

  it("uses the documented default tolerance", () => {
    const guide = samplePath("M10 10 L90 10", 40);
    const justInside = guide.map((point) => ({
      x: point.x,
      y: point.y + DEFAULT_TOLERANCE - 1,
    }));
    expect(computeCoverage(guide, justInside)).toBe(1);
  });
});
