import "@testing-library/jest-dom/vitest";
import "fake-indexeddb/auto";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup();
});

// jsdom implements neither of these; the app must degrade gracefully without them.
if (!("speechSynthesis" in window)) {
  Object.defineProperty(window, "speechSynthesis", { value: undefined, writable: true });
}

// Pointer capture is used by the tracing canvas and is missing from jsdom.
if (!Element.prototype.setPointerCapture) {
  Element.prototype.setPointerCapture = vi.fn();
  Element.prototype.releasePointerCapture = vi.fn();
  Element.prototype.hasPointerCapture = vi.fn(() => false);
}
