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
- **`compressHTML: true`**: also pinned. Astro 7 defaults to `'jsx'`, which strips
  whitespace between adjacent elements — that collapses the footer's `$ echo` row and the
  nav's `./` prefixes. Markup written from scratch can space explicitly and drop the pin.
- **Content**: Astro Content Collections — markdown files in `src/content/blog/`
- **Schema**: `src/content.config.ts` — posts require `title`, `description`, `date`; optional `draft`, `tags`
- **Build output**: `dist/` (gitignored). Never commit built files.
- **Deployment**: Docker multi-stage build → `static-web-server` behind Traefik. `compose.yml` defines production service.

---

## Content

Blog posts live in `src/content/blog/`. Frontmatter must match the schema in `src/content.config.ts`.

### Blog Post Style

- **Voice:** First-person, direct, opinionated. No preamble, no "Hope this helps" closings.
- **Opening:** Hook into a specific frustration or observation. Skip the generic intro.
- **Headings:**
  - `##` — lede/subtitle (one per post, immediately after the title, punchy)
  - `###` — main sections
  - `---` — horizontal rule between sections
  - No `#` (H1) anywhere in the post body
- **Closing:** End decisively. A statement, not a sendoff.
- **Grammar:** Correct. No "Do you ever wondering", no "Let's get started!"
- **Tone reference:** See the three most recent posts by date.

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

- Tailwind v4 via `@tailwindcss/vite`. Global styles in `src/styles/global.css`.
- Custom theme: Fira Code font, neutral-900 background, neutral-300 text.
- Expressive Code (`ec.config.mjs`) — code blocks use `dark-plus` theme, no border radius, transparent shadows.
- Pagefind integration provides search index built at `npm run build`.

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

- **No test suite** — no `vitest`, `jest`, or similar configured.
- **No CI/CD** — no GitHub Actions workflows in repo.
- **No ESLint** — only Prettier for formatting.
- **Single package** — not a monorepo; all code lives under `src/`.
- **Node version** — Docker uses Node 24; local dev should match (nvm recommended).
- **Generated files** — `.astro/` directory is generated; never edit files there.
- **Content assets** — images in `public/images/`; reference with absolute paths like `/images/piko-1.webp`.

---

## Common Tasks

### Add a blog post

1. Create `src/content/blog/<slug>.md` with required frontmatter (title, description, date, draft: false, tags)
2. Run `npm run dev` to verify rendering
3. Run `npm run format`
4. Commit with conventional commit: `feat: add post <title>`

### Update tag vocabulary

Edit the "Current Vocabulary" table and "Per-Post Tags" matrix in this file. Keep both in sync.

### Change site metadata

- Site URL: `astro.config.mjs` → `site` field
- Title/description per-page: in the page/layout component frontmatter
- Favicon/manifest: replace files in `public/`

### Modify Tailwind theme

Edit `src/styles/global.css` — `@theme` block and `@layer base` utilities.

---

## Gotchas

- **Port conflict**: Astro dev defaults to port 4321. Change via `npm run dev -- --port <n>` if needed.
- **Content cache**: Astro caches content collections in `.astro/data-store.json` (large, gitignored). Delete if content changes aren't reflected.
- **Image paths**: In markdown, use absolute paths starting with `/` (e.g., `![alt](/images/file.webp)`). Relative paths break in production.
- **Date format**: Use ISO 8601 with timezone offset (e.g., `2024-03-18T14:16:19+07:00`). Astro's date parser is strict.
- **Draft posts**: Set `draft: true` to exclude from builds. `draft` field is optional in schema but recommended for clarity.
- **Prettier on Astro files**: Must have the plugin installed; otherwise formatting corrupts `.astro` syntax. Verified in `devDependencies`.

---

## References

- `astro.config.mjs` — integrations (sitemap, pagefind, expressive-code)
- `src/content.config.ts` — content collection schema and loader
- `sws.config.toml` — production server and cache headers
- `compose.yml` — Docker Compose production service
- `README.md` — basic commands and tech stack
