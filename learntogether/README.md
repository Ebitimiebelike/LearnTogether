# LearnTogether

An offline-first learning app for letters, numbers, tracing and early literacy.

Built for learners who need large targets, audio support, repetition and
encouragement — including learners with motor and speech differences. There are
no ads, no accounts, no timers, and nothing that punishes a wrong answer.

---

## Running it

```bash
npm install
npm run dev          # http://localhost:3000
```

Offline support requires a production build — the service worker is not
generated in development:

```bash
npm run build
npm start            # http://localhost:3000
```

To verify offline behaviour: load the app once with `npm start`, then in
DevTools go to **Application → Service Workers** and confirm the worker is
active, switch **Network** to *Offline*, and reload. Every screen — including
letters and numbers you have never opened — should still work.

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server (no service worker) |
| `npm run build` | Production build, including the service worker |
| `npm start` | Serve the production build |
| `npm test` | Run the test suite once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run icons` | Regenerate the PWA icons in `public/icons/` |
| `npm run theme` | Regenerate the default theme music in `public/audio/` |

> The build uses `next build --webpack`. Next.js 16 defaults to Turbopack, but
> Serwist's service-worker plugin still requires webpack.

## Deploying

The app lives in the `learntogether/` subdirectory of this repository, so a
host needs to be told two things:

- **Root Directory:** `learntogether` — a project-level setting in the Vercel
  dashboard. It cannot be set from a config file, so it has to be set there.
- **Framework:** Next.js, built with `npm run build`. Both are pinned in
  [`vercel.json`](vercel.json), which takes precedence over dashboard settings,
  so framework detection cannot silently fall back to "static site" and publish
  only `public/`.

The build command matters: `npm run build` runs `next build --webpack`. Next.js
16 defaults to Turbopack, and a plain `next build` would fail because Serwist's
service-worker plugin requires webpack.

If pages 404 but files like `/icons/icon-192.png` still load, the deployment is
serving only `public/` — the framework was not detected as Next.js.

## Installing on a tablet

Visiting the site in a browser for the first time shows a welcome page with an
**Install app** button. What that button does depends on the platform, because
the platforms genuinely differ:

- **Android / Chromium** fires `beforeinstallprompt`, which is captured and
  replayed to open the real native install dialog.
- **iOS / Safari** exposes no programmatic install at all, so the button opens
  Share → Add to Home Screen instructions instead of pretending it can.
- **Anywhere else** it says where installing is possible rather than showing a
  button that would do nothing.

Either way the result is an icon on the home screen that launches standalone,
with no browser chrome, and works with no network at all.

The welcome page is only ever shown to a first-time visitor in a browser tab.
Anyone launching from the home screen, or returning with a learner already set
up, goes straight through — nobody should have to walk past a landing page to
reach a lesson. The same button also lives in Settings, for anyone who skipped
it. Requires HTTPS (or `localhost`).

---

## Project structure

```
src/
├── app/                      Routes only — thin shells over features
│   ├── layout.tsx            Fonts, metadata, viewport, theme, providers
│   ├── page.tsx              Welcome + install for new visitors; splash otherwise
│   ├── onboarding/ setup/ first-lesson/
│   ├── (learner)/            Learner shell with bottom navigation
│   │   ├── home/
│   │   ├── learn/{alphabet,numbers}/[…]
│   │   ├── trace/{letters,numbers}/[…]
│   │   ├── practice/{letters,numbers,listening}/
│   │   └── games/ rewards/ progress/
│   ├── (caregiver)/          Adult shell, no learner navigation
│   │   └── caregiver/ settings/
│   ├── manifest.ts           Web app manifest
│   └── sw.ts                 Service worker source
├── components/
│   ├── ui/                   Button, IconButton, Card, PageHeader, ProgressBar,
│   │                         BottomNavigation, Modal, Screen, Icon
│   ├── learning/             LessonCard, CategoryCard, LessonGrid, AudioButton,
│   │                         ChoiceButton, Illustration, QuantityDisplay,
│   │                         FeedbackBanner
│   ├── pwa/                  InstallAppButton
│   ├── tracing/              TracingCanvas
│   ├── games/                MatchGame
│   └── rewards/              AvatarCard, RewardCard, StarCount, Celebration
├── features/                 Domain logic and screen bodies, by area
│   ├── onboarding/ learners/ alphabet/ numbers/
│   ├── tracing/              coverage.ts (scoring), TraceActivity, screens
│   ├── practice/             questions.ts (generation), PracticeActivity
│   ├── progress/             mastery.ts, continue.ts
│   ├── rewards/              rewards.ts
│   └── caregiver/            stats.ts, pin.ts, PinGate, CaregiverDashboard
├── data/                     All lesson content
│   ├── alphabet.ts numbers.ts avatars.ts badges.ts
│   └── tracing/              shapes.ts letters.ts numbers.ts
├── lib/
│   ├── audio/                AudioService, speech providers, Web Audio effects,
│   │                         MusicService + cues.ts (theme music)
│   ├── storage/              driver.ts (IndexedDB), repositories.ts
│   ├── geometry/             path.ts — SVG path sampler
│   ├── pwa/                  Service worker registration, install detection
│   └── utils/                cn, date, random
├── hooks/                    useAudio, useTheme, useLessonVisit, useInstallApp
└── types/                    Domain types
tests/                        Vitest suites
scripts/generate-icons.mjs    PNG icon generator (no image dependency)
scripts/generate-theme.mjs    Theme music generator (no audio dependency)
```

### Architecture notes

**Lessons are data, not markup.** Every alphabet and number screen renders from
`src/data/alphabet.ts` and `src/data/numbers.ts`. Adding content, translating
it, or swapping the example words means editing those files and nothing else.

**Domain logic is pure and outside React.** Mastery calculation, reward and
streak logic, question generation and trace scoring are plain functions taking
plain data. That is why they are directly testable, and why the UI holds no
rules of its own.

**Storage is behind repositories.** Nothing above `src/lib/storage/` knows about
IndexedDB. Each repository is an interface with a local implementation; adding
cloud sync later means writing `ApiProgressRepository` and passing a different
`Repositories` object into `SessionProvider` — no component changes.

**Audio is behind a service.** `AudioService` exposes `speakLetter`,
`speakNumber`, `speakItem`, `speakSoundHint`, `speakInstruction`,
`playSuccess` and `playTryAgain`. It tries a recorded clip first and falls back
to the device voice, so dropping real recordings into `public/audio/` and
setting `LearningItem.audio` switches the whole app over. It also owns the theme
music, which is why speech can reliably duck it — see **Theme music** below.

**State is React state.** One context (`SessionProvider`) holds the learner,
settings, progress, rewards and recent activity. There is no server state to
reconcile, so no state library is warranted.

**The tracing engine is reusable.** `TracingCanvas` takes `strokes` and a
`character` and knows nothing about letters or numbers. Stroke data lives in
`src/data/tracing/`, so shapes or whole words can be added without touching the
component.

---

## Offline

After one online load, the whole app works with no network:

- `app/manifest.ts` provides the web app manifest; icons are local PNGs.
- `src/app/sw.ts` is compiled by Serwist into `public/sw.js` at build time.
- All 118 pages are prerendered as static HTML. The precache manifest lists
  every route explicitly — all 26 letter lessons, all 26 letter-tracing screens,
  all 21 number lessons and tracing screens, plus every other screen — so pages
  the learner has *never visited* are still available offline.
- JavaScript, CSS, the self-hosted Nunito font files, icons and the manifest are
  precached alongside them (176 entries in total).
- Lesson content and tracing data ship inside the JavaScript bundle, so they are
  covered by the same precache, as is the theme music.
- Nothing is fetched from a CDN at runtime. Illustrations are emoji rendered
  from system fonts, and the reward sounds are synthesised with the Web Audio
  API, so neither costs a single byte of download.
- Progress lives in IndexedDB on the device.

---

## Theme music

Music plays in exactly two places, and nowhere else:

- **When the app opens** — a short flourish on the splash screen.
- **On a correct answer** — the hook, for about ten seconds.

It is never a continuous background bed. That is a deliberate constraint:
spoken instructions ("Find A", "A says ah") are the app's primary channel, and
music playing under them would compete with the one thing the learner relies on.
So the music also **ducks automatically** to a low level whenever anything is
spoken, and **stops the moment the learner moves on** — it is a reward, never
something to sit through. A caregiver can turn it off entirely in Settings.

Both cues are regions of a single file, declared in
[`src/lib/audio/cues.ts`](src/lib/audio/cues.ts).

### Using your own music

1. Put the file in `public/audio/` — for example `public/audio/theme.mp3`.
2. In `src/lib/audio/cues.ts`, point `THEME_TRACK_URL` at it.
3. Set `THEME_CUES` to where your intro and chorus actually start and end, in
   seconds.

That is the whole change. `next.config.ts` imports `THEME_TRACK_URL` for the
offline precache list, so your file is cached for offline use automatically —
there is no second place to update.

The bundled default is synthesised by
[`scripts/generate-theme.mjs`](scripts/generate-theme.mjs) — a 90s-eurodance-style
instrumental at 138 BPM over an A minor / F / C / G progression, written
directly as PCM with no audio dependency, so it carries no third-party claim.
It is a 870 KB WAV; replacing it with an MP3 cuts that by roughly ten times.

> **On rights:** a commercial song stays copyrighted in both the composition and
> the recording, and that includes a recording captured from a stream. Fine for
> a private build on your own device; publishing or distributing the app with it
> would need a licence for both.

---

## Accessibility

These are enforced in the design system and the shared components rather than
left to each screen:

- **56px minimum touch target**, as `--spacing-touch`. Answer tiles and primary
  actions are much larger again.
- **18px base font size**; nothing in the app is below 16px.
- **High contrast** in both light and dark themes; every foreground/background
  pairing clears WCAG AA at its intended size.
- **Orientation is never locked.** A tablet may be in a stand, mounted, or held
  by someone who cannot turn it, so the manifest declares `orientation: "any"`
  and every screen is built for both. In landscape — where vertical space is the
  scarce resource — the tracing canvas, lesson screens and onboarding lay out
  side by side instead of stacking, and the tracing canvas is capped against
  viewport height so its buttons always stay in reach. Display type is sized in
  `vmin`, not `vw`, so a letter is the same size whichever way the device is
  held.
- **No timers anywhere.** No question, activity or animation is on a clock.
- **No flashing.** Animations are short, single-shot and gentle, and all of them
  respect `prefers-reduced-motion`.
- **Wrong answers are never punished.** A wrong tap plays a soft two-note tone,
  says "Good try", repeats the instruction and leaves every option enabled.
  Retries are unlimited, and only the first attempt is scored, so repeated tries
  never drag an item's success rate down.
- **Colour is never the only cue.** A correct answer shows a check mark as well
  as turning green.
- **The learner never has to speak, read much, or write accurately.**
- **Consistent navigation.** Four bottom-navigation destinations, always in the
  same place; the caregiver area and settings sit outside the learner's shell.
- **Three taps or fewer** from Home to any learning activity.

---

## Testing

```bash
npm test
```

343 tests across 14 files:

| File | Covers |
| --- | --- |
| `progress.test.ts` | Mastery derivation, activity application, summaries, items needing practice, continue-learning selection |
| `rewards.test.ts` | Star awards, badge unlocking, streak advance/reset across month boundaries |
| `storage.test.ts` | Both storage drivers against the same suite; per-learner isolation, settings migration, persistence across reopen |
| `practice.test.ts` | Question generation, distractor choice, difficulty clamping, deterministic sessions, matching rounds |
| `tracing-coverage.test.ts` | Trace scoring, tolerance, and that every character is passable with a shaky finger |
| `tracing-data.test.ts` | All 77 characters' stroke data parses and fits the canvas |
| `geometry.test.ts` | SVG path parsing, arc-length sampling, tangents, transforms |
| `audio.test.ts` | Graceful degradation when speech is unavailable, muted, or failing |
| `TracingCanvas.test.tsx` | Pointer events: draw, capture, cancel, gap interpolation, completion reporting |
| `flows.test.tsx` | Onboarding, learner creation, the first lesson, Home, a letter lesson, identification practice, the music setting |
| `music.test.ts` | Cue playback, self-stopping, ducking under speech, autoplay refusal and gesture retry |
| `install.test.tsx` | Install-state resolution per platform, the native prompt, iOS instructions, and who sees the welcome page |
| `orientation.test.ts` | Manifest never locks orientation; no text sized by viewport width; the tracing canvas is height-capped |

Several tests assert the app's *promises* rather than its mechanics — that a
wrong answer leaves the correct option enabled, that feedback never contains
discouraging wording, that no screen shows a countdown.

---

## Known limitations

These are deliberate MVP decisions, not oversights:

1. **Illustrations are emoji, not artwork.** `LearningItem.image` exists in the
   data model and `Illustration` uses it when set, but no item sets it yet.
   Emoji render from fonts already on the device, so they work offline from the
   first load and raise no licensing questions. Commissioned artwork can be
   dropped into `public/` and referenced from the data files with no code
   change. Exact glyphs vary a little between platforms.

2. **Speech uses the device voice.** There are no recorded clips yet.
   `LearningItem.audio` and `RecordedAudioProvider` are in place, and recordings
   take priority over synthesis the moment they exist. On a device with no
   speech voice the app stays fully usable and Settings explains the silence.

3. **Trace scoring is coverage, not handwriting recognition.** It asks whether
   the learner moved a finger along most of the guide, with a generous 12-unit
   tolerance and a 50% threshold. Stroke order and direction are shown but not
   enforced, and a determined scribble will pass. This is intentional: the MVP
   targets guided motor practice, and the score only ever chooses which
   encouraging message is shown — it never blocks progress.

4. **The caregiver PIN is a lock, not security.** It is stored in plain text on
   the device beside the data it protects. It keeps a learner out of the
   settings; it would not stop anyone with the tablet and a debugger. It must
   not be reused as-is if real data is ever synced to a backend.

5. **One learner per device.** The data model is keyed by `learnerId`
   throughout and the repositories are already multi-learner, but the UI creates
   and shows a single learner.

6. **Offline navigation falls back to a full page load.** When offline, Next's
   client-side router cannot fetch its navigation payload, so the browser does a
   normal page load, served from the precache. Navigation works; it is just
   marginally less instant than when online.

7. **`vitest.config.mts` is excluded from `tsc`.** `@vitejs/plugin-react` and
   `vitest` resolve different copies of Vite, so their plugin types conflict.
   This affects only the config file's type-checking, not the tests.

## Not included

Out of scope for this MVP, by design: accounts, cloud sync, analytics beyond the
caregiver dashboard, leaderboards, in-app purchases, additional languages, and
content beyond A–Z and 0–20.
