import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

/**
 * The service worker.
 *
 * `__SW_MANIFEST` is filled in at build time with every static asset and every
 * prerendered page, which is what makes the whole app usable offline: all 26
 * letter routes, all 21 number routes, the tracing screens, practice, games,
 * rewards and progress are precached as static HTML rather than fetched on
 * demand. Lesson content and stroke data ship inside the JavaScript bundles, so
 * they are covered by the same precache.
 *
 * `defaultCache` then handles anything not precached — chiefly Next's RSC
 * navigation payloads, which fall back to a full page load from the precache
 * when the device is offline.
 */
declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
  fallbacks: {
    entries: [
      {
        // If a navigation somehow misses the precache while offline, fall back
        // to the app shell rather than the browser's error page.
        url: "/",
        matcher: ({ request }) => request.destination === "document",
      },
    ],
  },
});

serwist.addEventListeners();
