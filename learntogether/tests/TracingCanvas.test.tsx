import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { fireEvent } from "@testing-library/dom";
import { TracingCanvas } from "@/components/tracing/TracingCanvas";
import { samplePath, type Point } from "@/lib/geometry/path";
import { getLetterTrace } from "@/data/tracing";

/**
 * Pointer-event tests for the tracing surface.
 *
 * jsdom reports every element as 0x0, so `getBoundingClientRect` is stubbed to
 * a 200x200 square. The canvas maps client coordinates into its 0–100 viewBox
 * by that rect, so a client point is exactly twice the canvas coordinate.
 */

const CANVAS_SIZE = 200;

function stubCanvasSize(element: Element) {
  vi.spyOn(element, "getBoundingClientRect").mockReturnValue({
    x: 0,
    y: 0,
    top: 0,
    left: 0,
    right: CANVAS_SIZE,
    bottom: CANVAS_SIZE,
    width: CANVAS_SIZE,
    height: CANVAS_SIZE,
    toJSON: () => ({}),
  } as DOMRect);
}

/** Converts a canvas-space point (0–100) to the client coordinate to dispatch. */
function client(point: Point) {
  return {
    clientX: (point.x / 100) * CANVAS_SIZE,
    clientY: (point.y / 100) * CANVAS_SIZE,
    pointerId: 1,
  };
}

/** Drives one full stroke: down, a series of moves, then up. */
function drawStroke(canvas: Element, points: Point[]) {
  fireEvent.pointerDown(canvas, client(points[0]));
  for (const point of points.slice(1)) {
    fireEvent.pointerMove(canvas, client(point));
  }
  fireEvent.pointerUp(canvas, client(points.at(-1)!));
}

const TRACE_L = getLetterTrace("L", "uppercase")!;
const TRACE_I = getLetterTrace("l", "lowercase")!;

function getCanvas() {
  return screen.getByRole("application");
}

describe("TracingCanvas", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders one guide path per stroke", () => {
    const { container } = render(
      <TracingCanvas strokes={TRACE_L.strokes} character="L" />,
    );
    // Guide plus dashed centre line, so two paths per stroke.
    const paths = container.querySelectorAll("path[d]");
    expect(paths.length).toBeGreaterThanOrEqual(TRACE_L.strokes.length * 2);
  });

  it("labels the tracing area for assistive technology", () => {
    render(<TracingCanvas strokes={TRACE_L.strokes} character="L" />);
    expect(getCanvas()).toHaveAttribute(
      "aria-label",
      expect.stringContaining("Tracing area for L"),
    );
  });

  it("shows a numbered start point for each stroke", () => {
    render(<TracingCanvas strokes={TRACE_L.strokes} character="L" />);
    // "L" has two strokes, so start markers 1 and 2.
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("disables browser touch gestures so the page cannot scroll while drawing", () => {
    render(<TracingCanvas strokes={TRACE_L.strokes} character="L" />);
    expect(getCanvas().getAttribute("class")).toContain("touch-none");
  });

  it("draws a polyline as the pointer moves", () => {
    const { container } = render(
      <TracingCanvas strokes={TRACE_I.strokes} character="l" />,
    );
    const canvas = getCanvas();
    stubCanvasSize(canvas);

    expect(container.querySelectorAll("polyline")).toHaveLength(0);
    drawStroke(canvas, samplePath(TRACE_I.strokes[0], 30));
    expect(container.querySelectorAll("polyline")).toHaveLength(1);
  });

  it("ignores pointer movement before the pointer goes down", () => {
    const { container } = render(
      <TracingCanvas strokes={TRACE_I.strokes} character="l" />,
    );
    const canvas = getCanvas();
    stubCanvasSize(canvas);

    fireEvent.pointerMove(canvas, client({ x: 50, y: 50 }));
    expect(container.querySelectorAll("polyline")).toHaveLength(0);
  });

  it("captures the pointer so a finger sliding off still finishes the stroke", () => {
    render(<TracingCanvas strokes={TRACE_I.strokes} character="l" />);
    const canvas = getCanvas();
    stubCanvasSize(canvas);
    const capture = vi.spyOn(canvas, "setPointerCapture");

    fireEvent.pointerDown(canvas, client({ x: 50, y: 47 }));
    expect(capture).toHaveBeenCalledWith(1);
  });

  it("starts a separate polyline for each stroke", () => {
    const { container } = render(
      <TracingCanvas strokes={TRACE_L.strokes} character="L" />,
    );
    const canvas = getCanvas();
    stubCanvasSize(canvas);

    drawStroke(canvas, samplePath(TRACE_L.strokes[0], 30));
    drawStroke(canvas, samplePath(TRACE_L.strokes[1], 30));
    expect(container.querySelectorAll("polyline")).toHaveLength(2);
  });

  it("reports a completed trace once the guide is followed", () => {
    const onComplete = vi.fn();
    render(
      <TracingCanvas
        strokes={TRACE_L.strokes}
        character="L"
        onComplete={onComplete}
      />,
    );
    const canvas = getCanvas();
    stubCanvasSize(canvas);

    for (const stroke of TRACE_L.strokes) {
      drawStroke(canvas, samplePath(stroke, 60));
    }

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete.mock.calls[0][0]).toMatchObject({ passed: true });
    expect(onComplete.mock.calls[0][0].message).toContain("L");
  });

  it("only reports completion once, however many extra strokes are drawn", () => {
    const onComplete = vi.fn();
    render(
      <TracingCanvas
        strokes={TRACE_L.strokes}
        character="L"
        onComplete={onComplete}
      />,
    );
    const canvas = getCanvas();
    stubCanvasSize(canvas);

    for (const stroke of TRACE_L.strokes) drawStroke(canvas, samplePath(stroke, 60));
    for (const stroke of TRACE_L.strokes) drawStroke(canvas, samplePath(stroke, 60));

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("reports every finished stroke, including unsuccessful ones", () => {
    const onStrokeEnd = vi.fn();
    const onComplete = vi.fn();
    render(
      <TracingCanvas
        strokes={TRACE_L.strokes}
        character="L"
        onStrokeEnd={onStrokeEnd}
        onComplete={onComplete}
      />,
    );
    const canvas = getCanvas();
    stubCanvasSize(canvas);

    // A short scribble in a corner: nowhere near the guide.
    drawStroke(canvas, [
      { x: 2, y: 2 },
      { x: 6, y: 6 },
      { x: 10, y: 10 },
    ]);

    expect(onStrokeEnd).toHaveBeenCalledTimes(1);
    expect(onStrokeEnd.mock.calls[0][0].passed).toBe(false);
    expect(onComplete).not.toHaveBeenCalled();
  });

  it("never reports a poor attempt with discouraging wording", () => {
    const onStrokeEnd = vi.fn();
    render(
      <TracingCanvas
        strokes={TRACE_L.strokes}
        character="L"
        onStrokeEnd={onStrokeEnd}
      />,
    );
    const canvas = getCanvas();
    stubCanvasSize(canvas);
    drawStroke(canvas, [
      { x: 2, y: 2 },
      { x: 5, y: 5 },
    ]);

    expect(onStrokeEnd.mock.calls[0][0].message).not.toMatch(
      /wrong|bad|incorrect|failed|error/i,
    );
  });

  it("treats a cancelled pointer as the end of a stroke", () => {
    const onStrokeEnd = vi.fn();
    render(
      <TracingCanvas
        strokes={TRACE_I.strokes}
        character="l"
        onStrokeEnd={onStrokeEnd}
      />,
    );
    const canvas = getCanvas();
    stubCanvasSize(canvas);

    fireEvent.pointerDown(canvas, client({ x: 50, y: 47 }));
    fireEvent.pointerMove(canvas, client({ x: 50, y: 70 }));
    fireEvent.pointerCancel(canvas, client({ x: 50, y: 70 }));

    expect(onStrokeEnd).toHaveBeenCalledTimes(1);
  });

  it("fills in gaps left by a fast swipe", () => {
    const onStrokeEnd = vi.fn();
    render(
      <TracingCanvas
        strokes={TRACE_I.strokes}
        character="l"
        onStrokeEnd={onStrokeEnd}
      />,
    );
    const canvas = getCanvas();
    stubCanvasSize(canvas);

    // Just three widely spaced points down the stem of "l", as a quick swipe
    // would produce. Interpolation should still score this as well covered.
    drawStroke(canvas, [
      { x: 50, y: 15 },
      { x: 50, y: 50 },
      { x: 50, y: 85 },
    ]);

    expect(onStrokeEnd.mock.calls[0][0].coverage).toBeGreaterThan(0.9);
  });

  it("starts a fresh canvas when remounted under a new key", () => {
    const { container, rerender } = render(
      <TracingCanvas key="a" strokes={TRACE_I.strokes} character="l" />,
    );
    const canvas = getCanvas();
    stubCanvasSize(canvas);
    drawStroke(canvas, samplePath(TRACE_I.strokes[0], 30));
    expect(container.querySelectorAll("polyline")).toHaveLength(1);

    // Changing the key is how the Clear and Try again buttons reset the canvas.
    rerender(<TracingCanvas key="b" strokes={TRACE_I.strokes} character="l" />);
    expect(container.querySelectorAll("polyline")).toHaveLength(0);
  });
});
