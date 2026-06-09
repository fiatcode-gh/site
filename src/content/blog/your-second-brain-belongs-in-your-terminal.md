---
title: "Your Second Brain Belongs in Your Terminal"
description: "Reading your second brain shouldn't require alt-tabbing to an Electron app"
date: 2026-06-08T18:55:00+07:00
draft: false
tags:
  - ai
  - linux
  - dev-setup
---

## Reading your second brain shouldn't require alt-tabbing to an Electron app

[Logseq](https://github.com/logseq/logseq) is my second brain. Every project I'm thinking about, every note worth keeping, every AI-generated session summary I want to revisit — it's all in there. And for a long time, that worked fine, because Logseq was something I opened in its own window.

Then I started writing more code with [Claude Code](https://github.com/anthropics/claude-code) and [OpenCode](https://github.com/opencode-ai/opencode) in the terminal, full-screen. And I started teaching my AI to write back to Logseq on its own — `journal-update` after a session to log what shipped, `find-todo` to surface open work across the graph, the whole [`ai-stack`](https://git.fiatcode.dev/fiatcode/ai-stack) plugin doing its thing. The AI was *actively* writing to my second brain. And to read what it just wrote, I had to alt-tab to an Electron app — heavy, slow to focus, hungry for RAM.

The seam was the problem. Two things that should have been one thing — my work surface and my knowledge store — were living in different windows, on different toolchains, in different mental contexts. Every time I alt-tabbed, I paid a tax.

So I built a TUI for it. It's called [peekseq](https://git.fiatcode.dev/fiatcode/peekseq).

---

### What peekseq is

A [Bubble Tea](https://github.com/charmbracelet/bubbletea) TUI that runs in the same terminal as Claude. Point it at your Logseq graph and it reads — recency-sorted page picker, [ripgrep](https://github.com/BurntSushi/ripgrep)-backed full-text search, backlinks for the current page, a TODO dashboard that groups open bullets across the graph. Pages render through [Glamour](https://github.com/charmbracelet/glamour) with hanging-indent bullets, colored workflow markers, and clickable wiki-links.

Cold start lands on today's journal. If the file doesn't exist yet, peekseq doesn't panic — it shows the page anyway and waits for you to do something. Every key you'd expect is bound somewhere; if you forget which, press `?` for an in-app keymap.

---

### How I actually use it

The shape of a typical peekseq session, in order.

I boot, it lands on today. Most days that's the right place. From there I do one of three things: jump back to look at a past journal, pick a specific page, or search.

For a past journal, `<` and `>` walk the days backwards and forwards — chronological, so I land on yesterday, or last Tuesday, without thinking. For a specific page, `Ctrl-P` opens a fuzzy picker that ranks by recency — the pages I touched recently are at the top, and as I type the fuzzy match narrows. "Alp" finds Alpha even though I mistyped. For a needle in a haystack, `/` shells out to [ripgrep](https://github.com/BurntSushi/ripgrep) and streams results back into a list I can scroll with `j` and `k`, then `Enter` opens the page scrolled to the matching line.

Once I'm on a page, `n` and `N` step through the wiki-links — every `[[link]]` in the rendered body is navigable. `Enter` follows the one under the cursor, and `[` walks me back through the history. It's browser-style back/forward, but for my own notes. If I want to know who else points at this page, `b` opens a backlinks panel — every page that mentions it, with the line as context. Self-references are filtered out, so I'm not told "this page mentions itself" twenty times.

`T` opens the TODO dashboard, which is where I live when I'm triaging work. Every `TODO`, `LATER`, `DOING`, and `WAITING` bullet across the graph, grouped by page, with the source line so I can pick up where I left off. `Enter` jumps to the page scrolled to the bullet.

And when I want to actually write something, I press `e`. peekseq hands the current page's file to my editor — `$VISUAL` first, then `$EDITOR`, then `/usr/bin/vi` as a last resort. The TUI suspends while the editor runs. When I save and quit, peekseq comes back, checks the file's mtime, and reindexes the graph only if it actually changed. If I opened the file, looked at it, and quit without saving, nothing happens — the index doesn't even know I was there.

That's the loop. Read, navigate, edit, repeat — all in the same pane, all without breaking the Claude session running next to it.

---

### The general lesson

peekseq started as a tool for me — built to scratch one specific itch in one specific workflow. But it doesn't *stay* that way. It opens any Logseq graph backed by plain `.md` files under `pages/` and `journals/`, and since v1.1 it edits them through whatever editor you already have. If your notes are on disk, peekseq will read them, link them, search them, and hand them off to your `$EDITOR` when you want to write.

So while it was born from one person's context-switch tax, the thing that came out the other side is generic enough for anyone running a Logseq graph in a terminal. Point it at your graph with `--graph` or `$PEEKSEQ_GRAPH`, and you have the same loop: boot, land on today, navigate, read, edit. No Electron. No separate window. Just the notes, in the same pane as the rest of your work.

If you live in a terminal and you keep a Logseq graph, give it a try. The whole thing is a single Go binary, the install is `go install`, and the README is honest about what it doesn't do.

