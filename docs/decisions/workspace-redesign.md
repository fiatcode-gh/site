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

## Traps

- Never name a component class after a Tailwind utility. A `.outline` class on the post rail also matched Tailwind's `outline` utility and drew a 1px outline around it in both themes.
- `prettier-plugin-astro` stays on 0.14 and `prettier-plugin-svelte` on 4.1. Their next majors move text inside a tag onto its own line, which adds spaces to the built HTML (`<a>⏎go home⏎</a>`). Nothing catches this, the same class of bug that keeps `compressHTML: true`.
- TypeScript stays on 6 until `@astrojs/svelte` accepts 7.

## Open

- The regex tool prints capture groups as `$1=me$2=home` with no separator. This predates the redesign.
- Only the Base64 tool uses `.tool-error`; other tools show errors as plain text.
- The Explorer adds about 16 KB of markup to every page and grows with each post. Fine at 22 posts; revisit if the archive grows a lot.
