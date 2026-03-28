# Agent Reference

Guidelines for AI agents working on this blog.

---

## Blog Post Style

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

---

## Tag System

### Current Vocabulary

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

### Per-Post Tags (current state)

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

### Rules for Tags

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
