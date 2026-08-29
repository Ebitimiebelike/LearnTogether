/**
 * A small SVG path sampler.
 *
 * Tracing needs three things from the same stroke definition: an outline to
 * render, points along the stroke to score the learner's drawing against, and a
 * tangent direction for the guide arrows. Browsers expose `getPointAtLength`,
 * but relying on it would make the scoring logic untestable outside a browser,
 * so the small subset of path syntax the tracing data uses is parsed here.
 *
 * Supported commands: M, L, H, V, C, Q and Z, absolute only. That is enough to
 * describe every letter and digit in `data/tracing`.
 */

export interface Point {
  x: number;
  y: number;
}

export interface SampledPoint extends Point {
  /** Tangent direction in degrees, 0 = pointing right, clockwise positive. */
  angle: number;
}

type Segment =
  | { kind: "line"; from: Point; to: Point }
  | { kind: "quad"; from: Point; control: Point; to: Point }
  | { kind: "cubic"; from: Point; c1: Point; c2: Point; to: Point };

const NUMBER_PATTERN = /-?\d*\.?\d+(?:e[-+]?\d+)?/gi;

/** Splits a path string into `[command, ...numbers]` groups. */
function tokenize(d: string): { command: string; values: number[] }[] {
  const groups: { command: string; values: number[] }[] = [];
  const matches = d.match(/[a-z][^a-z]*/gi) ?? [];
  for (const match of matches) {
    const command = match[0];
    const values = (match.slice(1).match(NUMBER_PATTERN) ?? []).map(Number);
    groups.push({ command, values });
  }
  return groups;
}

export function parsePath(d: string): Segment[] {
  const segments: Segment[] = [];
  let cursor: Point = { x: 0, y: 0 };
  let subpathStart: Point = { x: 0, y: 0 };

  for (const { command, values } of tokenize(d)) {
    switch (command) {
      case "M": {
        cursor = { x: values[0], y: values[1] };
        subpathStart = cursor;
        // Extra coordinate pairs after M are implicit line-tos.
        for (let i = 2; i + 1 < values.length; i += 2) {
          const to = { x: values[i], y: values[i + 1] };
          segments.push({ kind: "line", from: cursor, to });
          cursor = to;
        }
        break;
      }
      case "L": {
        for (let i = 0; i + 1 < values.length; i += 2) {
          const to = { x: values[i], y: values[i + 1] };
          segments.push({ kind: "line", from: cursor, to });
          cursor = to;
        }
        break;
      }
      case "H": {
        for (const x of values) {
          const to = { x, y: cursor.y };
          segments.push({ kind: "line", from: cursor, to });
          cursor = to;
        }
        break;
      }
      case "V": {
        for (const y of values) {
          const to = { x: cursor.x, y };
          segments.push({ kind: "line", from: cursor, to });
          cursor = to;
        }
        break;
      }
      case "Q": {
        for (let i = 0; i + 3 < values.length; i += 4) {
          const control = { x: values[i], y: values[i + 1] };
          const to = { x: values[i + 2], y: values[i + 3] };
          segments.push({ kind: "quad", from: cursor, control, to });
          cursor = to;
        }
        break;
      }
      case "C": {
        for (let i = 0; i + 5 < values.length; i += 6) {
          const c1 = { x: values[i], y: values[i + 1] };
          const c2 = { x: values[i + 2], y: values[i + 3] };
          const to = { x: values[i + 4], y: values[i + 5] };
          segments.push({ kind: "cubic", from: cursor, c1, c2, to });
          cursor = to;
        }
        break;
      }
      case "Z":
      case "z": {
        segments.push({ kind: "line", from: cursor, to: subpathStart });
        cursor = subpathStart;
        break;
      }
      default:
        throw new Error(
          `Unsupported path command "${command}". Tracing data may only use M, L, H, V, C, Q and Z.`,
        );
    }
  }
  return segments;
}

function pointOn(segment: Segment, t: number): Point {
  switch (segment.kind) {
    case "line":
      return {
        x: segment.from.x + (segment.to.x - segment.from.x) * t,
        y: segment.from.y + (segment.to.y - segment.from.y) * t,
      };
    case "quad": {
      const u = 1 - t;
      return {
        x: u * u * segment.from.x + 2 * u * t * segment.control.x + t * t * segment.to.x,
        y: u * u * segment.from.y + 2 * u * t * segment.control.y + t * t * segment.to.y,
      };
    }
    case "cubic": {
      const u = 1 - t;
      return {
        x:
          u * u * u * segment.from.x +
          3 * u * u * t * segment.c1.x +
          3 * u * t * t * segment.c2.x +
          t * t * t * segment.to.x,
        y:
          u * u * u * segment.from.y +
          3 * u * u * t * segment.c1.y +
          3 * u * t * t * segment.c2.y +
          t * t * t * segment.to.y,
      };
    }
  }
}

/** Curves are flattened into this many straight pieces before measuring. */
const FLATTEN_STEPS = 24;

interface Flattened {
  points: Point[];
  /** Cumulative distance from the start of the path at each point. */
  distances: number[];
  length: number;
}

function distance(a: Point, b: Point) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function flatten(d: string): Flattened {
  const segments = parsePath(d);
  const points: Point[] = [];
  const distances: number[] = [];
  let total = 0;

  for (const segment of segments) {
    const steps = segment.kind === "line" ? 1 : FLATTEN_STEPS;
    for (let step = 0; step <= steps; step++) {
      const point = pointOn(segment, step / steps);
      // Skip the duplicate shared point between consecutive segments.
      if (points.length > 0 && step === 0) continue;
      if (points.length > 0) total += distance(points[points.length - 1], point);
      points.push(point);
      distances.push(total);
    }
  }

  return { points, distances, length: total };
}

export function pathLength(d: string): number {
  return flatten(d).length;
}

/** The point at `length` units along the path, with its tangent angle. */
function pointAtLength(flat: Flattened, length: number): SampledPoint {
  const { points, distances } = flat;
  if (points.length === 0) return { x: 0, y: 0, angle: 0 };
  if (points.length === 1) return { ...points[0], angle: 0 };

  const clamped = Math.max(0, Math.min(length, flat.length));
  let index = 1;
  while (index < distances.length - 1 && distances[index] < clamped) index++;

  const previous = points[index - 1];
  const current = points[index];
  const span = distances[index] - distances[index - 1];
  const t = span === 0 ? 0 : (clamped - distances[index - 1]) / span;

  return {
    x: previous.x + (current.x - previous.x) * t,
    y: previous.y + (current.y - previous.y) * t,
    angle: (Math.atan2(current.y - previous.y, current.x - previous.x) * 180) / Math.PI,
  };
}

/**
 * Returns `count` points spread evenly by arc length along the path, from start
 * to end inclusive.
 */
export function samplePath(d: string, count: number): SampledPoint[] {
  if (count < 1) return [];
  const flat = flatten(d);
  if (count === 1) return [pointAtLength(flat, 0)];
  const step = flat.length / (count - 1);
  return Array.from({ length: count }, (_, index) =>
    pointAtLength(flat, step * index),
  );
}

/** The point a given fraction (0–1) along the path. Used to place guide arrows. */
export function pointAtFraction(d: string, fraction: number): SampledPoint {
  const flat = flatten(d);
  return pointAtLength(flat, flat.length * fraction);
}

function round(value: number) {
  // Two decimals keeps the generated strings short without visible drift.
  return Math.round(value * 100) / 100;
}

/**
 * Scales then translates a path.
 *
 * Used to compose two-digit numbers (10–20) out of the single-digit stroke
 * data rather than duplicating it.
 */
export function transformPath(
  d: string,
  scale: number,
  offsetX: number,
  offsetY: number,
): string {
  const map = (point: Point) =>
    `${round(point.x * scale + offsetX)} ${round(point.y * scale + offsetY)}`;

  return parsePath(d)
    .map((segment, index, all) => {
      // Only emit a move when the segment does not continue the previous one.
      const previous = all[index - 1];
      const needsMove =
        !previous ||
        previous.to.x !== segment.from.x ||
        previous.to.y !== segment.from.y;
      const prefix = needsMove ? `M${map(segment.from)} ` : "";

      switch (segment.kind) {
        case "line":
          return `${prefix}L${map(segment.to)}`;
        case "quad":
          return `${prefix}Q${map(segment.control)} ${map(segment.to)}`;
        case "cubic":
          return `${prefix}C${map(segment.c1)} ${map(segment.c2)} ${map(segment.to)}`;
      }
    })
    .join(" ");
}
