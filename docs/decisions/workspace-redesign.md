# Workspace redesign

Shipped in [#3](https://github.com/fiatcode-gh/site/pull/3) (`1ba12c3`), on top of the dependency bump in [#2](https://github.com/fiatcode-gh/site/pull/2) (`7178dd9`).

## What and why

The site now looks like a modern code editor: tabs for the main nav, a file-path breadcrumb, an Explorer sidebar, an outline rail on posts and a status-bar footer. Light and dark themes follow the system setting. It replaced the brutalist paper theme from August 2026.

## Decisions

- **Direction.** The editor look was picked from seven mockups over two rounds. The first round was all print-inspired (newspaper serif, Swiss grid, riso zine, a refined brutalist): every one was rejected on mood. The second round tested three moods: dev-tool docs, playful and warm, and modern technical. Technical won.
- **Not retro.** A dark amber CRT terminal theme ("The Craftsman's Terminal") was retired in August 2026 on purpose. The editor look must stay modern: no scanlines, phosphor glow or man-page parody.
- **No theme toggle.** `prefers-color-scheme` decides. A toggle would need JavaScript and stored state for little gain.
- **Explorer from 1240px.** Below that width, showing the sidebar would squeeze post text under 60 characters per line. This is the one breakpoint beyond 900px and 620px.
- **Dates in `Asia/Jakarta`.** Every post is written at +07:00. Formatting in the build machine's zone showed a post dated 00:00+07:00 one day early on a UTC machine.
- **No description under the post title.** The `##` lede already states the thesis right below. The outline rail shows a tag count, and the tags themselves stay under the title.
- **Pinned like an IDE from 1240px.** The Explorer scrolled away with the page. Pinning it alone left its last rows below the window on load, because the title bar and breadcrumb sat above it; the fix chosen was to pin the title bar and breadcrumb too, rather than shorten the Explorer and leave an empty strip under it once scrolled. The footer folds into one pinned status bar. Their heights live in `--chrome-h` and `--status-h`.
- **Three footer layouts.** Desktop is one status-bar line with icon-only links. 620–1239px keeps the two-row panel and status bar. Phones put the quote first, then one row of 44px icon links; the status segments only make sense on the desktop bar.
- **Favicon is an editor tile, and it is the logo.** A dark tile with a blue JetBrains Mono "f" and an amber block cursor, in the dark theme's colours in both themes, with a thin border so it holds on dark tab bars. The first draft copied the old logo (white f on a blue rounded square) and was rejected: at tab size it reads as Facebook. The title bar shows `public/favicon.svg` itself as its logo mark, so the two cannot drift. `scripts/mkfav.py` regenerates the whole set.

## Traps

- Never name a component class after a Tailwind utility. A `.outline` class on the post rail also matched Tailwind's `outline` utility and drew a 1px outline around it in both themes.
- `prettier-plugin-astro` stays on 0.14 and `prettier-plugin-svelte` on 4.1. Their next majors move text inside a tag onto its own line, which adds spaces to the built HTML (`<a>⏎go home⏎</a>`). Nothing catches this, the same class of bug that keeps `compressHTML: true`.
- TypeScript stays on 6 until `@astrojs/svelte` accepts 7.
- No `overscroll-behavior: contain` on the Explorer: Chromium applies it to a panel that does not overflow, so the mouse wheel did nothing over a short tree.
- Tool outputs that are rows or tables (Cron's run list and description, UUID's id list, the Exif and JWT tables) keep their own utility styling on purpose: `.pane-out` is a single preformatted box and does not fit them. Text outputs use `.pane-out`; a read-only output that is still a form control (JSON's textarea) adds `border-field`.

## Open

- The Explorer adds about 16 KB of markup to every page and grows with each post. Fine at 22 posts; revisit if the archive grows a lot.
