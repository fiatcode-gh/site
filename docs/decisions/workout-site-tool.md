# Workout tool

Shipped in [#7](https://github.com/fiatcode-gh/site/pull/7) from branch `feat/workout-tool`. The tool is a port of the standalone Sweat Seeker app (a private repository at `1757a98`).

## What and why

`/tools/workout` plans a full-body bodyweight session for every day: placement, a daily plan with a recovery rhythm, a session player, progression, and history. It joins the other privacy-first tools and keeps their promise: everything stays in the tab. The behaviour is the approved Sweat Seeker behaviour. The port changed only where the tool lives, what it is built with, and how it looks.

Left out: accounts, sync, analytics, a service worker, a theme toggle, data migration from the standalone origin (a backup file is the only way to move data), and a blog post.

## Decisions

- **Port, not embed.** The training logic is TypeScript under `src/lib/tools/workout/`, the screens are Svelte under `src/components/tools/workout/`, and the 406 standalone tests became 396 vitest cases plus 12 new ones. The 10 cases not ported tested things the site does not have: the standalone static server, and an app-version check against its own `package.json`.
- **The domain takes the clock and date as inputs.** Nothing under the lib touches the DOM, timers, `Date.now()` or `Math.random`, and `architecture.test.ts` enforces this. The tests stay deterministic, and the island owns every browser concern.
- **One storage key, a frozen backup format.** The key is `fiatcode.workout.state`, namespaced next to the cycle tracker's. The backup envelope still says `"format": "sweat-seeker-backup"`, `schemaVersion: 1`, `appVersion: "1.0.0"`, so standalone exports import unchanged. A fixture from `1757a98` is checked to parse, validate unchanged and rebuild byte for byte. Only the file name changed (`workout-backup-<date>.json`).
- **Hash routing inside one island.** Screens live at `#/today`, `#/progress/<id>` and so on, so back and forward work. Any hash not starting with `#/` (the site's `#main` skip link) leaves the screen alone.
- **`$state.raw`, never a deep proxy.** The domain compares states by identity (`next === state`) and expects plain objects.
- **Site look, one convention.** Site tokens only. The one new primitive is `.tool-btn-primary`, the filled lead action of a screen. `kw` draws the figures' motion marks and `fn` fills the session progress bar. Control labels are lowercase like the other tools, while headings, dialog titles and sentences keep sentence case. There are no `<style>` blocks and nothing fixed or sticky in the island: a native modal `<dialog>` is the only top layer.
- **Player at arm's length.** Below 620px the player stage fills the screen between the pinned chrome and the status bar, with the controls docked at the bottom, so nothing scrolls mid-set at 390 or 360px. Player buttons and chips are at least 48px, above the site's 40px minimum. From 620px the stage takes its natural height; filling a tablet left a 550px empty band.
- **Cards stop at two columns.** Progress cards and the placement result use 1 column below 620px and 2 from 620px. Three columns next to the Explorer left about 180px of text per card, and five placement cards fell into a 3 + 2 grid.
- **Review sheet as a page.** `/tools/workout/gallery/` shows all 87 drawings at 220px and 96px, plus the real Today screen rendered for a fixed recovery Sunday and a fixed training Monday. It is unlisted, `noindex` and dropped from the sitemap, like `/tools/cycle`. A page was the only way to review the figures on real tokens in both themes, and the specimens show the recovery look without faking the clock.
- **Weak drawings redrawn, in two rounds.** Seventeen poses were redrawn (two of them twice) so ladder neighbours differ at 96px. A test keeps 14 pairs at a pose distance of 8 or more, and a second test keeps the wall handstands leaning at least 18° off the wall, so the body never reads as a second wall. Two drawings stay known limits. The archer push-up keeps its view from above, because only that view shows the wide hand placement, and it reads as a diagram. The long-lever plank stays close to the forearm plank, because a side view cannot show "elbows ahead of the shoulders" much better at 96px. The distance number is a guard, not proof that a drawing reads well: several pairs scored over 8 and still looked alike. The sheets at 96px are the proof.
- **"Last:" lines carry units.** The standalone showed "45, 45" for both seconds and reps.

## Traps

- No `npm run format` on this branch's base: it would rewrite the unformatted `.github/workflows/build.yml`. Format by path.
- Svelte 5 hands a component the old state while it is being removed. The player's pause-on-leave check runs in a `queueMicrotask`, or a finished session gets announced as "Paused."
- A focus target must be scrolled into view before `focus({ preventScroll: true })`. Otherwise `save session` took focus below the pinned status bar at 1280px.
- `.tool-btn` has a 120ms colour transition. A screenshot taken right after a theme switch shows dialog buttons greyed out. It is the transition, not the contrast, which measures 12.5:1.
- Headless WebKit's `uploadFile` refuses the 1px `sr-only` file input. Drive imports in Chromium.
- `<svg` counts on a built page include the site chrome's 6 icons. Count figures by `data-wk="figure"`.

## Open

- Safari on Mac and iPhone: focus after a mouse `pause` and `resume`. WebKit's Linux build passed the check in a container (focus returns to `pause`; after a reload it lands on the primary button). Linux WebKit focuses a button on a mouse press and Safari does not, so Safari's own case is still unobserved.
- `var(--color-kw)` as an SVG `stroke` attribute was checked in Chromium and WebKit, not in Firefox.
- Drawings close at 96px but accepted: pseudo planche push-up can pass for a low plank; handstand push-up negative and wall handstand push-up differ mainly by the arrow and the head.
- The island has no component tests. Regressions there only show in a browser.
