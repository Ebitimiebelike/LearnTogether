/**
 * Theme music: which file, and which parts of it to play.
 *
 * ─── Using your own music ──────────────────────────────────────────────────
 *
 * 1. Put the file in `public/audio/` — for example `public/audio/theme.mp3`.
 * 2. Point `THEME_TRACK_URL` at it.
 * 3. Set the cue times below to where your intro and chorus actually are.
 *
 * That is the whole change. `next.config.ts` imports `THEME_TRACK_URL` for the
 * offline precache list, so the file is cached for offline use automatically —
 * there is no second place to update, and no risk of precaching a path that
 * does not exist.
 *
 * This file is deliberately free of imports so the build config can read it.
 *
 * ─── A note on rights ──────────────────────────────────────────────────────
 *
 * The bundled default is synthesised by `scripts/generate-theme.mjs`, so it is
 * free of any third-party claim. A commercial song — including a recording of
 * one made from a stream — stays copyrighted in both the composition and the
 * recording. That is fine for a private build on your own device; distributing
 * or publishing the app with it would need a licence for both.
 */

/** The audio file the cues below refer to. Must exist in `public/`. */
export const THEME_TRACK_URL = "/audio/theme.wav";

/** A named region of the track, in seconds. */
export interface MusicCue {
  start: number;
  end: number;
}

export type MusicCueName = "opening" | "celebration";

export const THEME_CUES: Record<MusicCueName, MusicCue> = {
  /**
   * Played once when the app is opened. Kept short so it never delays a
   * learner who already knows where they are going — the splash screen moves
   * on regardless of whether this has finished.
   */
  opening: { start: 0, end: 3.478 },

  /**
   * The hook, played when the learner gets something right. Capped at roughly
   * ten seconds and stopped as soon as they move on, so it stays a reward
   * rather than something to sit through.
   */
  celebration: { start: 3.478, end: 13.913 },
};

/** How loud the music sits by default. Speech is the priority, so not loud. */
export const DEFAULT_MUSIC_VOLUME = 0.45;

/**
 * The level music drops to while something is being spoken. Spoken
 * instructions are the app's primary channel and must always win.
 */
export const DUCKED_MUSIC_VOLUME = 0.12;

/** Fade lengths in milliseconds. Nothing starts or stops abruptly. */
export const FADE_IN_MS = 120;
export const FADE_OUT_MS = 420;
