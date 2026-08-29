/**
 * Helpers for building the curved parts of tracing strokes.
 *
 * All tracing paths live in a 0–100 square. Letters sit between y=15 (cap
 * height) and y=85 (baseline); lowercase x-height starts at y=45 and
 * descenders reach y=97.
 *
 * Angles are degrees in SVG space, so 0 points right and -90 points up.
 * Because y grows downwards, an *increasing* angle sweeps clockwise on screen
 * and a *decreasing* angle sweeps counter-clockwise — which matters, since the
 * sweep direction is the direction the learner is asked to move their finger.
 */

const RADIANS = Math.PI / 180;

function round(value: number) {
  return Math.round(value * 100) / 100;
}

/**
 * An elliptical arc as cubic Béziers, so the path sampler only ever has to
 * understand M/C.
 */
export function arc(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  startDeg: number,
  endDeg: number,
): string {
  const start = startDeg * RADIANS;
  const end = endDeg * RADIANS;
  // Split into pieces of at most 90° so the Bézier approximation stays tight.
  const pieces = Math.max(1, Math.ceil(Math.abs(endDeg - startDeg) / 90));
  const step = (end - start) / pieces;

  const at = (angle: number) => ({
    x: cx + rx * Math.cos(angle),
    y: cy + ry * Math.sin(angle),
  });
  const derivative = (angle: number) => ({
    x: -rx * Math.sin(angle),
    y: ry * Math.cos(angle),
  });

  const first = at(start);
  let d = `M${round(first.x)} ${round(first.y)}`;
  const alpha = (4 / 3) * Math.tan(step / 4);

  for (let piece = 0; piece < pieces; piece++) {
    const a1 = start + step * piece;
    const a2 = a1 + step;
    const p0 = at(a1);
    const p3 = at(a2);
    const d1 = derivative(a1);
    const d2 = derivative(a2);
    const c1 = { x: p0.x + alpha * d1.x, y: p0.y + alpha * d1.y };
    const c2 = { x: p3.x - alpha * d2.x, y: p3.y - alpha * d2.y };
    d += ` C${round(c1.x)} ${round(c1.y)} ${round(c2.x)} ${round(c2.y)} ${round(p3.x)} ${round(p3.y)}`;
  }

  return d;
}

/** A full ellipse, drawn counter-clockwise from the top — the way "o" is written. */
export function oval(cx: number, cy: number, rx: number, ry: number): string {
  return arc(cx, cy, rx, ry, -90, -450);
}

/** A full ellipse drawn clockwise from the left — the bowl of "b" and "p". */
export function bowlClockwise(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
): string {
  return arc(cx, cy, rx, ry, 180, 540);
}

/** A full ellipse drawn counter-clockwise from the right — the bowl of "d" and "q". */
export function bowlCounterClockwise(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
): string {
  return arc(cx, cy, rx, ry, 0, -360);
}
