/**
 * Scoring for tracing activities.
 *
 * The goal of the MVP is guided motor practice, not handwriting recognition.
 * Scoring is therefore deliberately lenient: it asks "did the learner move a
 * finger along most of the guide?", never "is this well formed?". A learner can
 * always move on regardless of the score, and the score never produces a
 * failure state — only which encouraging message is shown.
 */
import { samplePath, type Point } from "@/lib/geometry/path";

/** How many guide points each stroke is checked at. */
export const SAMPLES_PER_STROKE = 40;

/**
 * How far, in the 0–100 tracing coordinate space, a drawn point may be from a
 * guide point and still count. 12 units is roughly a fingertip's width on a
 * tablet, which keeps the activity achievable with limited fine motor control.
 */
export const DEFAULT_TOLERANCE = 12;

/** Fraction of the guide that must be covered for the warmest praise. */
export const PASS_THRESHOLD = 0.5;

export interface TraceResult {
  /** 0–1: fraction of the guide the learner's strokes passed near. */
  coverage: number;
  /** True when the trace earns a star. Never used to block progress. */
  passed: boolean;
  /** Encouraging message. Never negative. */
  message: string;
}

/**
 * Fraction of `targets` that have at least one point of `drawn` within
 * `tolerance`.
 */
export function computeCoverage(
  targets: Point[],
  drawn: Point[],
  tolerance: number = DEFAULT_TOLERANCE,
): number {
  if (targets.length === 0) return 0;
  if (drawn.length === 0) return 0;

  const toleranceSquared = tolerance * tolerance;
  let covered = 0;

  for (const target of targets) {
    for (const point of drawn) {
      const dx = point.x - target.x;
      const dy = point.y - target.y;
      if (dx * dx + dy * dy <= toleranceSquared) {
        covered++;
        break;
      }
    }
  }

  return covered / targets.length;
}

/** All guide points for a character, sampled evenly along each stroke. */
export function guidePoints(strokes: string[]): Point[] {
  return strokes.flatMap((stroke) => samplePath(stroke, SAMPLES_PER_STROKE));
}

/**
 * Turns the learner's raw strokes into a result and a message.
 *
 * `character` is used only to personalise the praise, e.g. "Great job tracing A!".
 */
export function evaluateTrace(
  strokes: string[],
  drawn: Point[],
  character: string,
  tolerance: number = DEFAULT_TOLERANCE,
): TraceResult {
  const coverage = computeCoverage(guidePoints(strokes), drawn, tolerance);
  const passed = coverage >= PASS_THRESHOLD;

  let message: string;
  if (coverage >= 0.8) message = `Great job tracing ${character}!`;
  else if (passed) message = `Nice tracing, ${character}!`;
  else if (coverage > 0) message = `Good try! Let's trace ${character} again.`;
  else message = `Follow the dots to trace ${character}.`;

  return { coverage, passed, message };
}
