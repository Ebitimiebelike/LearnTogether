import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";
import { LETTER_SLUGS } from "./src/data/alphabet";
import { NUMBER_SLUGS } from "./src/data/numbers";
import { THEME_TRACK_URL } from "./src/lib/audio/cues";

/**
 * Every route in the app, precached so the learner can open any of them with no
 * network at all.
 *
 * `@serwist/next` builds its precache manifest from the webpack compilation,
 * which covers JavaScript, CSS, fonts and `public/` — but not the prerendered
 * HTML documents. Listing the routes here makes the service worker fetch and
 * store each page during install, so a first launch online is enough to make
 * the whole app available offline afterwards.
 *
 * The lists come from the same lesson data the app renders from, so a new
 * letter or number is covered automatically.
 */
const ROUTES = [
  "/",
  // The manifest and icons live in `public/`, which the webpack plugin does not
  // scan, so they are listed alongside the routes.
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/maskable-512.png",
  "/icons/apple-touch-icon.png",
  // The theme track, so music works offline. Imported rather than hard-coded,
  // so pointing THEME_TRACK_URL at your own file also caches that file.
  THEME_TRACK_URL,
  "/onboarding",
  "/setup",
  "/first-lesson",
  "/home",
  "/learn",
  "/learn/alphabet",
  "/learn/numbers",
  "/trace",
  "/trace/letters",
  "/trace/numbers",
  "/practice",
  "/practice/letters",
  "/practice/numbers",
  "/practice/listening",
  "/games",
  "/rewards",
  "/progress",
  "/caregiver",
  "/settings",
  ...LETTER_SLUGS.flatMap((letter) => [
    `/learn/alphabet/${letter}`,
    `/trace/letters/${letter}`,
  ]),
  ...NUMBER_SLUGS.flatMap((number) => [
    `/learn/numbers/${number}`,
    `/trace/numbers/${number}`,
  ]),
];

/**
 * Page HTML embeds content-hashed script URLs, so it must be re-fetched on
 * every deployment. One revision per build does exactly that.
 */
const BUILD_REVISION = Date.now().toString(36);

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  // The service worker is not generated in development. Use
  // `npm run build && npm start` to exercise offline behaviour.
  disable: process.env.NODE_ENV === "development",
  additionalPrecacheEntries: ROUTES.map((url) => ({
    url,
    revision: BUILD_REVISION,
  })),
  // Reloading the moment a device reconnects would interrupt a learner
  // mid-activity, so updates wait until the app is next opened.
  reloadOnOnline: false,
});

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          // The worker itself must never be served stale, or updates never land.
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
    ];
  },
};

export default withSerwist(nextConfig);
