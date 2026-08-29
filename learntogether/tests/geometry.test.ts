import { describe, expect, it } from "vitest";
import {
  parsePath,
  pathLength,
  pointAtFraction,
  samplePath,
  transformPath,
} from "@/lib/geometry/path";
import { arc, oval } from "@/data/tracing/shapes";

describe("parsePath", () => {
  it("parses a straight line", () => {
    expect(parsePath("M0 0 L10 0")).toEqual([
      { kind: "line", from: { x: 0, y: 0 }, to: { x: 10, y: 0 } },
    ]);
  });

  it("treats extra pairs after M as line-tos", () => {
    expect(parsePath("M0 0 10 0")).toHaveLength(1);
  });

  it("supports H, V and Z", () => {
    const segments = parsePath("M0 0 H10 V10 Z");
    expect(segments).toHaveLength(3);
    expect(segments[2].to).toEqual({ x: 0, y: 0 });
  });

  it("rejects commands the sampler cannot measure", () => {
    // Arcs must be expressed as cubics, otherwise scoring would silently differ
    // from what is drawn on screen.
    expect(() => parsePath("M0 0 A5 5 0 0 1 10 0")).toThrow(/Unsupported/);
  });
});

describe("pathLength", () => {
  it("measures straight lines exactly", () => {
    expect(pathLength("M0 0 L3 4")).toBeCloseTo(5, 6);
  });

  it("measures a circle close to 2*pi*r", () => {
    expect(pathLength(oval(50, 50, 20, 20))).toBeCloseTo(2 * Math.PI * 20, 0);
  });
});

describe("samplePath", () => {
  it("spreads points evenly by arc length", () => {
    const points = samplePath("M0 0 L100 0", 5);
    expect(points.map((p) => Math.round(p.x))).toEqual([0, 25, 50, 75, 100]);
  });

  it("includes both endpoints", () => {
    const points = samplePath("M10 10 L10 90", 3);
    expect(points[0]).toMatchObject({ x: 10, y: 10 });
    expect(points.at(-1)).toMatchObject({ x: 10, y: 90 });
  });

  it("reports the tangent direction", () => {
    // Downwards in SVG space is +90 degrees.
    expect(samplePath("M0 0 L0 10", 2)[0].angle).toBeCloseTo(90, 5);
  });
});

describe("pointAtFraction", () => {
  it("finds the midpoint", () => {
    expect(pointAtFraction("M0 0 L100 0", 0.5).x).toBeCloseTo(50, 5);
  });
});

describe("transformPath", () => {
  it("scales and offsets every coordinate", () => {
    expect(transformPath("M0 0 L10 10", 2, 5, 1)).toBe("M5 1 L25 21");
  });

  it("round-trips through the sampler", () => {
    const scaled = transformPath("M0 0 L10 0", 0.5, 0, 0);
    expect(pathLength(scaled)).toBeCloseTo(5, 6);
  });

  it("preserves curves", () => {
    const transformed = transformPath(arc(50, 50, 10, 10, 0, 90), 1, 0, 0);
    expect(transformed).toContain("C");
    expect(pathLength(transformed)).toBeCloseTo(pathLength(arc(50, 50, 10, 10, 0, 90)), 4);
  });
});

describe("arc", () => {
  it("starts and ends at the requested angles", () => {
    const quarter = arc(0, 0, 10, 10, 0, 90);
    const points = samplePath(quarter, 2);
    expect(points[0]).toMatchObject({ x: 10 });
    expect(points.at(-1)!.y).toBeCloseTo(10, 4);
  });
});
