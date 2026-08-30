import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import manifest from "@/app/manifest";

/**
 * Orientation.
 *
 * A tablet is often in a stand, or mounted, or held by someone who cannot turn
 * it. These tests pin two decisions that follow from that: the app must never
 * lock an orientation, and nothing may be sized by viewport *width*, which is
 * what silently breaks landscape.
 */

describe("the web app manifest", () => {
  const built = manifest();

  it("never locks the orientation", () => {
    // "portrait-primary" or "landscape-primary" would make the app unusable for
    // a learner who cannot rotate their device.
    expect(built.orientation).toBe("any");
  });

  it("still declares everything needed to be installable", () => {
    expect(built.name).toBe("LearnTogether");
    expect(built.display).toBe("standalone");
    expect(built.start_url).toBe("/");
    const sizes = (built.icons ?? []).map((icon) => icon.sizes);
    expect(sizes).toContain("192x192");
    expect(sizes).toContain("512x512");
    expect((built.icons ?? []).some((icon) => icon.purpose === "maskable")).toBe(true);
  });
});

/** Every .ts/.tsx file under src/. */
function sourceFiles(dir = "src"): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return sourceFiles(full);
    return /\.tsx?$/.test(entry) ? [full] : [];
  });
}

describe("sizing that survives rotation", () => {
  const files = sourceFiles();

  it("has source files to check", () => {
    expect(files.length).toBeGreaterThan(40);
  });

  /**
   * `34vw` reads as "about a third of the screen" in portrait, but on a
   * landscape tablet it becomes a 400px glyph. Display type is sized with
   * `vmin`, which tracks the shorter edge and so means the same thing either
   * way round.
   */
  it("never sizes text by viewport width", () => {
    const offenders = files.filter((file) => {
      const source = readFileSync(file, "utf8");
      return /text-\[[^\]]*\dvw/.test(source);
    });
    expect(offenders).toEqual([]);
  });

  /**
   * A full-width square is taller than a landscape screen, which would push the
   * Clear / Try again / Next buttons out of reach.
   */
  it("caps the tracing canvas against viewport height", () => {
    const canvas = readFileSync("src/components/tracing/TracingCanvas.tsx", "utf8");
    expect(canvas).toContain("aspect-square");
    expect(canvas).toMatch(/max-w-\[min\(100%,\s*\d+vh\)\]/);
  });

  /** The screens most at risk of running off the bottom of a landscape view. */
  it("adapts the layouts that would otherwise stack too tall", () => {
    const adapted = [
      "src/features/tracing/TraceActivity.tsx",
      "src/features/alphabet/LetterLesson.tsx",
      "src/features/numbers/NumberLesson.tsx",
      "src/features/onboarding/OnboardingFlow.tsx",
      "src/app/(learner)/home/page.tsx",
      "src/app/page.tsx",
    ];
    for (const file of adapted) {
      expect(readFileSync(file, "utf8"), `${file} has no landscape handling`).toContain(
        "landscape:",
      );
    }
  });
});
