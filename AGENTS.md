# Agent Instructions

Compact guidance for OpenCode sessions working on this repository.

---

## Quick Start

```sh
npm install
npm run dev        # dev server at http://localhost:4321
npm run build      # production build to ./dist/
npm run preview    # serve production build locally
npm run format     # Prettier across entire codebase
```

**Never skip `npm install` after checkout.** Dependencies are not vendored.

---

## Architecture

- **Framework**: Astro 7 with Tailwind CSS v4 (Vite plugin)
- **Markdown processor**: pinned to `unified()` in `astro.config.mjs`. Astro 7 defaults to
  Sätteri; the posts and Expressive Code both rely on the remark/rehype pipeline, so the
  pin keeps rendering unchanged. Porting to Sätteri is a separate job.
- **`compressHTML: true`**: also pinned, and meant to stay. Astro 7 defaults to
  `'jsx'`, which strips whitespace between adjacent elements. Prose here routinely puts
  an inline `<span class="hl">` next to running text, and Prettier may reflow that onto
  its own line; under `'jsx'` the reflow silently eats the space
  (`file input.Nothing leaves this tab.`). No test catches it and reading does not
  reveal it, so keep the HTML-aware compression.
- **Content**: Astro Content Collections — markdown files in `src/content/blog/`
- **Schema**: `src/content.config.ts` — posts require `title`, `description`, `date`; optional `draft`, `tags`
- **Build output**: `dist/` (gitignored). Never commit built files.
- **Deployment**: Docker multi-stage build → `static-web-server` behind Traefik. `compose.yml` defines production service.

---

## Content

Blog posts live in `src/content/blog/`. Frontmatter must match the schema in `src/content.config.ts`.

### Blog Post Style

- **Voice:** follow `.omp/skills/blog-post/voice.md` (the author's own voice rules).
- **Headings:**
  - `##` — lede/subtitle (optional, at most one, immediately after the title, punchy): opinion/argument posts use one; how-to/setup posts skip it
  - `###` — main sections
  - `---` — horizontal rule between sections
  - No `#` (H1) anywhere in the post body

### Tag System

#### Current Vocabulary

| Tag                   | Description                                                               |
| --------------------- | ------------------------------------------------------------------------- |
| `linux`               | Linux-specific content — distros, tools, fixes                            |
| `flutter`             | Flutter framework, mobile development                                     |
| `android`             | Android-specific content, ADB, AVD                                        |
| `windows`             | Windows-specific content, PowerShell, Win tooling                         |
| `git`                 | Git commands, workflows, hosting                                          |
| `hardware`            | Physical hardware, drivers, firmware quirks                               |
| `ai`                  | AI-assisted development, LLM tools, agents                                |
| `dev-setup`           | Developer environment, tooling, workflow, DX                              |
| `dart`                | Dart language, Dart-specific libraries                                    |
| `go`                  | Go language                                                               |
| `craftsmanship`       | Software design, architecture, TDD, DDD, Clean Architecture, code quality |
| `self-hosting`        | Self-hosted services, VPS, infrastructure                                 |
| `distributed-systems` | Distributed data, sync, CRDTs, consensus                                  |
| `misc`                | Catch-all for posts that don't fit elsewhere                              |

#### Per-Post Tags (current state)

| Post                                         | Tags                           |
| -------------------------------------------- | ------------------------------ |
| stop-stashing-use-git-worktree               | `git`, `dev-setup`             |
| vibe-coding-still-needs-a-craftsman          | `ai`, `craftsmanship`          |
| building-my-own-self-hosted-music-library    | `linux`, `self-hosting`        |
| building-load-testing-script-with-claude     | `go`, `ai`                     |
| crdt-conflict-free-replicated-data-types     | `dart`, `distributed-systems`  |
| fix-adb-unsufficient-permission-linux        | `linux`, `android`             |
| fix-infinix-air-pro-plus-quad-speakers-linux | `linux`, `hardware`            |
| fix-infinix-air-pro-plus-screen-color        | `windows`, `linux`, `hardware` |
| flutter-android-emulator-not-showing         | `flutter`, `android`           |
| flutter-clean-architecture                   | `flutter`, `craftsmanship`     |
| immutable-workstation-fedora-kinoite         | `linux`, `dev-setup`           |
| kuwot (draft)                                | `flutter`, `dart`              |
| remap-copilot-key-infinix-air-pro-plus       | `linux`, `hardware`            |
| sign-github-commit-on-windows                | `git`, `windows`               |
| using-direnv-in-powershell-on-windows        | `windows`, `dev-setup`         |
| welcome                                      | `misc`                         |

#### Rules for Tags

**When tagging a post:**

- Use 2–4 tags per post. More than 4 is a sign you're being too specific.
- Prefer tags from the existing vocabulary above.
- A tag should describe what the post _is about_, not every concept it _mentions_.

**When adding a new tag:**

- Ask: will this tag apply to at least one other existing post, or is it clearly a category this blog will write about again?
- If yes: add it to the vocabulary table above and apply it.
- If no: fold into an existing tag or leave it out.
- Do not add tags for topics covered once and unlikely to recur (e.g. `music`, `testing`, `open-source`).
- Document new tags in this file.

---

## Styling

"Workspace": the site reads like a modern code editor (Zed / VS Code), not a retro
terminal. Title bar with section tabs, a file-path breadcrumb, an Explorer sidebar,
the page as the open buffer, and a status bar as the footer. Light and dark are both
designed; `prefers-color-scheme` picks one. There is no manual toggle and no theming
JavaScript.

- Tailwind v4 via `@tailwindcss/vite`. All tokens and shared primitives live in
  `src/styles/global.css`; shell pieces (title bar, breadcrumb, Explorer, footer,
  TOC, tool shell) keep their own scoped `<style>`.
- **Tokens** are Tailwind colours in one `@theme static` block (light values), with
  the dark values overriding the same `--color-*` variables in a
  `prefers-color-scheme: dark` media query right below it. Use them as utilities
  (`text-muted`, `bg-raised`, `border-line`) or as `var(--color-…)`:
  - surfaces: `surface` (page/buffer), `chrome` (title bar, Explorer, tab strips),
    `raised` (panes, inputs, code), `hover`, `select` (current item), `mark`
    (highlighted data only: regex hits, `.hl`, the cycle tracker's period days
    and bars, the workout week strip's trained days — never a state or an
    action), `lede`, `quote`;
  - lines: `line`, `line-strong`, and `field` for form-control borders (the one
    line that must meet 3:1 against its surface, WCAG 1.4.11);
  - text: `fg`, `muted`, `faint`, and `gutter` (decorative only);
  - syntax: `fn`, `str`, `kw`, plus `active` (`fn` in light, `kw` in dark). The
    code-block `num` colour exists only as a literal in `ec.config.mjs`;
  - status bar: `status`, `status-fg`, `status-seg`, `status-seg-fg`.
- **Type**: JetBrains Mono (`--font-mono`) for chrome, meta, labels and code; IBM
  Plex Sans (`--font-sans`) for prose and long text. Self-hosted latin subsets via
  `@fontsource`; never add a Google Fonts request. Prose is 17px / 1.75, 68ch.
- **Expressive Code** (`ec.config.mjs`) builds a light and a dark theme from the
  same palette and switches them with the media query (`themeCssSelector: false`).
  EC needs literal colours, so the palette there is a copy of the CSS tokens —
  change both together, then delete `.astro/` and `node_modules/.astro` (see
  Gotchas).
- Search is a client-side filter over title/description/tags (`src/lib/search.ts`),
  with the index inlined into `/search`. Pagefind was removed.

### Rules that are easy to break

- **Three syntax colours, each with one meaning.** `fn` (blue) is what you can
  follow or call: links, focus rings, tool names, the blockquote bar, the hero
  name. `str` (green) is data: tags, the "runs locally" dot, YAML values. `kw`
  (amber) marks structure: section numbers, the `// thesis` label, list markers,
  YAML keys, the search prompt, the `ƒ` glyph, the tool-error bar. The `active`
  bar is `fn` in light and `kw` in dark. The workout tool adds two uses: `kw`
  draws the figures' motion marks and `fn` fills the session progress bar. Pick
  by meaning, and do not add a fourth.
- **Never name a component class after a Tailwind utility.** Tailwind scans
  `class=` attributes and emits the utility for any matching name, so a
  `class="outline"` rail picked up `outline-style`/`outline-width` and drew a
  foreground ring. Prefix component classes (`post-rail`, `fn-list`) instead.
- **Contrast floor is 4.5:1 for all text, in both themes.** `faint` is the floor
  (4.8 on chrome in light) and drops under it on `select` — use `muted` there.
  `gutter` (3.7:1) is for `aria-hidden` glyphs only: line numbers, breadcrumb and
  meta separators. The measured pairs are in the comments next to the tokens.
- **Encode state by shape, position or weight — not hue.** The open tab, mode
  button and cycle-tracker tab get the surface background, a 2px `active` bar and
  heavier weight; the current Explorer row and TOC item get a bar; tool errors
  use `.tool-error` (a left bar and weight, with `aria-live="polite"`), never
  plain text; the cycle tracker's day types differ by fill, ring weight and
  underline.
- **Decorative generated text uses alt text**: write `content: "x"; content: "x" / "";`
  so screen readers skip it where supported (`// thesis`, section numbers, `#`
  before tags, `()` after tool names).
- **Hairline grids** (`.ruled`, `.ruled-flex`) draw rules with a 1px `gap` over a
  `--color-line` background, so cells carry no border. When two neighbours share
  an edge, exactly one draws it.
- **Breakpoints**: 900px (Outline rail → `<details>` contents list, editor padding)
  and 620px (stacked title bar, 40px tap targets — tool controls use `.tool-btn`
  (`.tool-btn-primary` for a screen's one lead action) or
  `max-[620px]:min-h-10`; `max-[620px]` is `width < 620px`, matching the media
  queries, where `max-[619px]` would leave 619px out). The Explorer adds exactly
  one more, 1240px: with the 260px sidebar and the 240px Outline both shown, a
  post's prose falls under 60ch below that width, so the sidebar hides and the
  tabs are the navigation.
- **From 1240px the workspace is pinned, like an IDE.** The title bar and
  breadcrumb (`.chrome` in `Layout.astro`) stick to the top, the Explorer sticks
  under them with its own scroll, and the footer folds into one sticky status bar
  at the bottom. Their heights are `--chrome-h` (81px) and `--status-h` (28px) in
  `global.css`; both are 0 below 1240px. The Explorer's `top`/`max-height`, the
  Outline rail's `top` and `scroll-padding` read them, so a change to the title
  bar, the breadcrumb (fixed at 36px there) or the status bar must update them.
  The Explorer's chrome background and right rule are painted by `.workbench`,
  because the sticky panel is only as tall as its tree; an inline script scrolls
  the panel (never the page) so the current page's row is in view on load.
- **The footer has three layouts.** From 1240px: one status-bar line, the quote
  ellipsised (full text in `title`), rss/github/mastodon icon-only. 620–1239px:
  the two-row panel and status bar with text labels. Below 620px: the quote first,
  then one row of 44px icon links and `© year fiatcode`; the status segments are
  hidden. Icon-only link text stays in the DOM as `sr-only`, never removed.
- **No horizontal page scroll at 390px.** Only code blocks and prose tables scroll
  sideways; the breadcrumb stays one line and ellipsises its last crumb.
- Heading convention drives prose styling: `##` is the lede (the `// thesis`
  block) and `###` are sections, numbered 01, 02… by a CSS counter that the
  contents list mirrors. The contents list shows h3/h4, never the lede.
- Transitions sit behind `prefers-reduced-motion: no-preference` (in Svelte
  utilities, `motion-safe:transition-colors`, never bare `transition-colors`).

---

## Prettier

**Format before committing.** The config (`.prettierrc`) uses:

- `prettier-plugin-astro` — parses `.astro` files
- `prettier-plugin-organize-imports` — sorts imports automatically

`npm run format` writes changes in place. No separate lint step exists.

---

## Production Caching

`sws.config.toml` (mounted into Docker container) defines cache headers:

- HTML: `no-cache, must-revalidate` — always revalidate
- Astro assets (`/_astro/*`): `max-age=31536000, immutable` — fingerprinted, cache forever
- Images/fonts: `max-age=604800` — 1 week

Do not change without understanding fingerprinting behavior.

---

## Docker & Deployment

- **Build**: `docker build -t site .` (multi-stage: node:24-alpine → static-web-server)
- **Run**: `docker compose up -d` (uses external `traefik-proxy` network)
- **Port**: Container serves on port 80; Traefik routes `fiatcode.dev` and `www.fiatcode.dev`
- **Config**: `sws.config.toml` mounted at `/config.toml`; `SERVER_CONFIG_FILE` env var points to it.
- **No build args or secrets** — site is fully static.

---

## Important Constraints

- **Tests** — `vitest`, run with `npm test`. 545 tests over the tool libs, the TOC
  helpers, the search filter, and the post/nav helpers (`src/lib/posts.ts`,
  `src/lib/nav.ts`). Each module of `src/lib/tools/workout/` has a test at the
  same path under `tests/lib/workout/`, except `types.ts`, `core/version.ts`,
  `core/reasons.ts`, `library/patterns.ts` and the data files under
  `library/movements/` and `library/poses/`. Three test files have no module:
  `app/journey`, `architecture` and `contrast`; `support/simulate.ts` and
  `fixtures/` are helpers. There is no component or visual test layer.
- **Workout tool** — stores everything under one `localStorage` key,
  `fiatcode.workout.state`. Its illustration review sheet `/tools/workout/gallery/`
  is unlisted and dropped from the sitemap by the filter in `astro.config.mjs`.
  The session player keeps 48px controls on purpose, above the site's 40px minimum.
- **CI** — GitHub Actions (`.github/workflows/build.yml`) builds the image on every
  pull request and publishes it to `ghcr.io/fiatcode-gh/site` on push to `main`. It
  does NOT run tests or check formatting, so both are on you before pushing.
- **No ESLint** — only Prettier for formatting.
- **Single package** — not a monorepo; all code lives under `src/`.
- **Node version** — Docker uses Node 24; local dev should match (nvm recommended).
- **Generated files** — `.astro/` is generated; never edit files there.
- **Content assets** — images in `public/images/`; reference with absolute paths like `/images/piko-1.webp`.

---

## Common Tasks

### Add a blog post

1. Create `src/content/blog/<slug>.md` with required frontmatter (title, description, date, tags) and `draft: true`; flip it to `false` only when the author says to publish
2. Run `npm run dev` to verify rendering (every page hides drafts, so this needs `draft: false`)
3. Run `npm run format`
4. Commit with conventional commit: `feat: add post <title>`

### Update tag vocabulary

Edit the "Current Vocabulary" table and "Per-Post Tags" matrix in this file. Keep both in sync.

### Change site metadata

- Site URL: `astro.config.mjs` → `site` field
- Title/description per-page: in the page/layout component frontmatter
- Favicon/manifest: regenerate the icon set with `scripts/mkfav.py` (command in
  its docstring); the title-bar logo is `public/favicon.svg` itself

### Modify Tailwind theme

Edit `src/styles/global.css` — `@theme` block and `@layer base` utilities.

---

## Gotchas

- **Port conflict**: Astro dev defaults to port 4321. Change via `npm run dev -- --port <n>` if needed.
- **Content cache**: Astro caches rendered content in **`node_modules/.astro`** as well as `.astro/`. Clearing only `.astro/` is not enough — a stale `node_modules/.astro` will keep serving previously highlighted code blocks, so a code-theme change appears to do nothing. Delete both.
- **Image paths**: In markdown, use absolute paths starting with `/` (e.g., `![alt](/images/file.webp)`). Relative paths break in production.
- **Date format**: Use ISO 8601 with timezone offset (e.g., `2024-03-18T14:16:19+07:00`). Astro's date parser is strict.
- **Draft posts**: Set `draft: true` to exclude from builds. `draft` field is optional in schema but recommended for clarity.
- **Prettier on Astro files**: Must have the plugin installed; otherwise formatting corrupts `.astro` syntax. Verified in `devDependencies`.

---

## References

- `astro.config.mjs` — integrations (expressive-code, sitemap, svelte)
- `src/content.config.ts` — content collection schema and loader
- `sws.config.toml` — production server and cache headers
- `compose.yml` — Docker Compose production service
- `README.md` — basic commands and tech stack
