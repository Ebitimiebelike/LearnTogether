"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { pointAtFraction, type Point } from "@/lib/geometry/path";
import { evaluateTrace, type TraceResult } from "@/features/tracing/coverage";
import { cn } from "@/lib/utils/cn";

/**
 * The reusable tracing surface.
 *
 * It knows nothing about letters or numbers: give it a list of SVG stroke paths
 * in the 0–100 coordinate space and it renders the guide, start points,
 * direction arrows and the learner's own drawing. Anything with stroke data —
 * shapes, or whole words later — can reuse it unchanged.
 *
 * Interaction is pointer-events based, so finger, stylus and mouse all travel
 * the same code path.
 *
 * To clear the canvas, change the component's React `key`. Remounting is
 * exactly the "start over" semantics the Clear and Try again buttons want, and
 * it keeps this component free of imperative handles.
 */

export interface TracingCanvasProps {
  /** Ordered stroke paths, from `data/tracing`. */
  strokes: string[];
  /** The character being traced. Used for the feedback message and the label. */
  character: string;
  /** Fires the first time the trace is good enough. */
  onComplete?: (result: TraceResult) => void;
  /** Fires every time a stroke finishes, whatever the score. */
  onStrokeEnd?: (result: TraceResult) => void;
  className?: string;
}

/** Drawn points closer together than this are dropped as noise. */
const MIN_POINT_DISTANCE = 0.6;
/**
 * A fast finger produces widely spaced pointer events. Gaps larger than this
 * are filled in, so scoring reflects the line drawn on screen rather than the
 * device's sampling rate.
 */
const MAX_POINT_GAP = 2;

export function TracingCanvas({
  strokes,
  character,
  onComplete,
  onStrokeEnd,
  className,
}: TracingCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  // The ref is the source of truth during a stroke; state exists to re-render.
  const drawnRef = useRef<Point[][]>([]);
  const [drawn, setDrawn] = useState<Point[][]>([]);
  const [drawing, setDrawing] = useState(false);
  const [completed, setCompleted] = useState(false);

  // Start dots and arrows are derived from the same stroke data that is drawn
  // and scored, so the guidance can never drift out of step with the guide.
  const guides = useMemo(
    () =>
      strokes.map((stroke, index) => ({
        index,
        start: pointAtFraction(stroke, 0),
        arrows: [0.38, 0.78].map((fraction) => pointAtFraction(stroke, fraction)),
      })),
    [strokes],
  );

  const toCanvasSpace = useCallback((clientX: number, clientY: number): Point | null => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;
    // The viewBox is 0–100 and the element is square, so this maps exactly.
    return {
      x: ((clientX - rect.left) / rect.width) * 100,
      y: ((clientY - rect.top) / rect.height) * 100,
    };
  }, []);

  const appendPoint = useCallback((point: Point) => {
    const strokePoints = drawnRef.current.at(-1);
    if (!strokePoints) return;

    const last = strokePoints.at(-1);
    if (last) {
      const gap = Math.hypot(point.x - last.x, point.y - last.y);
      if (gap < MIN_POINT_DISTANCE) return;

      if (gap > MAX_POINT_GAP) {
        const steps = Math.ceil(gap / MAX_POINT_GAP);
        for (let step = 1; step <= steps; step++) {
          strokePoints.push({
            x: last.x + ((point.x - last.x) * step) / steps,
            y: last.y + ((point.y - last.y) * step) / steps,
          });
        }
        setDrawn(drawnRef.current.map((stroke) => [...stroke]));
        return;
      }
    }

    strokePoints.push(point);
    setDrawn(drawnRef.current.map((stroke) => [...stroke]));
  }, []);

  const handlePointerDown = (event: React.PointerEvent<SVGSVGElement>) => {
    const point = toCanvasSpace(event.clientX, event.clientY);
    if (!point) return;
    // Capture so a finger sliding off the canvas still finishes its stroke.
    event.currentTarget.setPointerCapture?.(event.pointerId);
    drawnRef.current = [...drawnRef.current, [point]];
    setDrawn(drawnRef.current.map((stroke) => [...stroke]));
    setDrawing(true);
  };

  const handlePointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    if (!drawing) return;
    const point = toCanvasSpace(event.clientX, event.clientY);
    if (point) appendPoint(point);
  };

  const handlePointerUp = (event: React.PointerEvent<SVGSVGElement>) => {
    if (!drawing) return;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    setDrawing(false);

    const result = evaluateTrace(strokes, drawnRef.current.flat(), character);
    onStrokeEnd?.(result);
    if (result.passed && !completed) {
      setCompleted(true);
      onComplete?.(result);
    }
  };

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 100 100"
      role="application"
      aria-label={`Tracing area for ${character}. Follow the line with your finger.`}
      // `touch-none` stops the page scrolling under a tracing finger.
      className={cn(
        "aspect-square w-full touch-none select-none rounded-card bg-surface shadow-card",
        className,
      )}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* Faint cap-height, mid and base lines, to place the character. */}
      <g stroke="var(--border-subtle)" strokeWidth="0.5" strokeDasharray="2 3">
        <line x1="6" y1="15" x2="94" y2="15" />
        <line x1="6" y1="50" x2="94" y2="50" />
        <line x1="6" y1="85" x2="94" y2="85" />
      </g>

      {/* The guide: a thick, easy channel to follow. Turns green when traced. */}
      <g
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        stroke={completed ? "var(--success-soft)" : "var(--surface-sunken)"}
        strokeWidth="13"
      >
        {strokes.map((stroke, index) => (
          <path key={`guide-${index}`} d={stroke} />
        ))}
      </g>

      {/* A dashed centre line showing exactly where to move. */}
      <g
        fill="none"
        strokeLinecap="round"
        stroke={completed ? "var(--success)" : "var(--ink-muted)"}
        strokeWidth="0.9"
        strokeDasharray="2.5 3.5"
        opacity="0.75"
      >
        {strokes.map((stroke, index) => (
          <path key={`dash-${index}`} d={stroke} />
        ))}
      </g>

      {/* Numbered start points and direction arrows. Hidden once traced. */}
      {!completed &&
        guides.map((guide) => (
          <g key={`marks-${guide.index}`}>
            {guide.arrows.map((arrow, arrowIndex) => (
              <path
                key={`arrow-${arrowIndex}`}
                // A small triangle pointing along the stroke's tangent.
                d="M-2.2 -2.2 L2.6 0 L-2.2 2.2 Z"
                fill="var(--primary)"
                opacity="0.55"
                transform={`translate(${arrow.x} ${arrow.y}) rotate(${arrow.angle})`}
              />
            ))}
            <circle cx={guide.start.x} cy={guide.start.y} r="4.6" fill="var(--primary)" />
            <text
              x={guide.start.x}
              y={guide.start.y + 1.9}
              textAnchor="middle"
              fontSize="5.5"
              fontWeight="700"
              fill="var(--on-primary)"
            >
              {guide.index + 1}
            </text>
          </g>
        ))}

      {/* The learner's own strokes, thick enough to be clearly visible. */}
      <g
        fill="none"
        stroke="var(--primary)"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.85"
      >
        {drawn.map((stroke, index) => (
          <polyline
            key={`drawn-${index}`}
            points={stroke.map((point) => `${point.x},${point.y}`).join(" ")}
          />
        ))}
      </g>
    </svg>
  );
}
