---
title: "Your Tool's Name Is a Spec"
description: "peekseq became weft — and the rename did more design work than any feature I shipped around it."
date: 2026-06-17T12:18:36+07:00
draft: false
tags:
  - craftsmanship
  - dev-setup
---

## I shipped `peekseq` as a Logseq viewer. Renaming it to `weft` was how I learned what it had become.

A couple of weeks ago I wrote that [your second brain belongs in your terminal](/posts/your-second-brain-belongs-in-your-terminal), and I shipped a little Go TUI to prove it. I called it `peekseq`. _Peek_, as in look — a viewer for my Logseq graph that ran in the same pane as Claude.

The name stopped being true almost immediately.

I kept adding things. An in-app editor. Live `[[`-completion while you type. A backlinks panel that finds unlinked mentions — the places you wrote a page's name in plain text but never linked. Then one-key linkify, which reaches into _another_ file and wraps that mention in `[[…]]` for you. Somewhere in there it quietly stopped being a thing you look at and became a thing you think in.

You don't _peek_ at a tool that writes back. The name had become a lie. So I renamed it — and the interesting part wasn't the find-and-replace.

---

### The rename was the design work

Picking a name forces you to finish a sentence you've been avoiding: _this tool is a \_\_\_._ For months I'd dodged it. "It's like Logseq but terminal" is not a sentence — it's a comparison standing in for an identity.

`weft` made me finish it.

In weaving, the **warp** is the set of threads held taut lengthwise on the loom. The **weft** is the thread you pass back and forth across them. Warp without weft is just parallel lines; the weft is what turns threads into fabric.

That's the tool. My journals are the warp — a daily timeline, laid down one parallel line at a time. The wiki-links are the weft, woven across the days, tying a Tuesday to a project to a half-formed idea three weeks back. The fabric is the thing I actually think in.

The name isn't decoration anymore. It names the structure. And once I had that, two decisions that used to feel arbitrary became obvious.

One linking primitive, no tags. Logseq gives you `[[links]]` _and_ `#tags`, which are secretly the same thing. `weft` has one kind of cross-thread. You don't weave fabric with two kinds of weft.

---

### Navigator, not an outliner

Here's the line I won't cross, and naming the tool is what made me see it as a line at all.

Logseq is an outliner. The bullet is a node you manage — you fold it, zoom into it, reference it from elsewhere, drag it around a tree. That's its whole identity.

`weft` renders your bullets. It does not make you tend them. No fold, no block references, no zoom. It shows you the outline; it doesn't ask you to garden it.

That's the single biggest thing that makes `weft` _not_ Logseq, and it's the decision I'll get the most pressure to reverse — every missing outliner feature looks like a gap if you squint. It isn't a gap. It's the point. A navigator that turns into an outliner is just a worse Logseq, and I already had Logseq.

Writing the name down turned a pile of "didn't get to it yet" into one sentence I can defend: it navigates, it doesn't outline.

---

### The rename had a tax, and Go charged it at release

Renaming a Go project is mostly a sweep — module path, imports, the binary, a fistful of `PEEKSEQ_*` environment variables. Mechanical. I had it green and tagged `v2.0.0` in an afternoon.

Then I ran `go install` and it pulled `v1.4.0`.

Go's semantic import versioning: a module at major version 2 or higher has to carry `/v2` in its path, or the tag is invisible. `go install …@latest` just shrugs and keeps serving the newest `v1`. My shiny `v2.0.0` existed and nobody could reach it.

The fix is a one-line module-path change — `git.fiatcode.dev/fiatcode/weft/v2` — that ripples through every import in the repo. Not hard. But it's the kind of tax that's invisible right up until the worst moment to discover it, which is the release. If you ever take a Go tool to v2, the path is part of the version. The tag alone is a promise the toolchain won't keep.

---

### Cutting the brand doesn't cut the format

Here's the part I didn't expect to matter, and it's the real lesson.

I've actually left Logseq now — the app, I mean. I don't open it anymore. `weft` and nvim are how I read the graph; the AI skills I taught to write my journal are how it gets written. So the rebrand felt total: new name, new tool, old app gone.

Except the files didn't change. And the files aren't only mine to read.

nvim opens them. The `journal-update` skill opens them after every session. `memory-update`, `find-todo`, all of it — a small fleet of things that read and write the same `.md` files on disk. The graph is a _shared substrate_, and the format it's written in is a contract with everything that touches it. Not an allegiance to the app I left — a contract with the tools that are still here.

That reframes every question. I used to ask, half-consciously, "is this faithful to how Logseq does it?" Wrong question — Logseq's gone. The right one is: "does this fit how I work, without breaking the things that read the same files?" Fidelity to fit. The brand was free to go; the format has to keep its promises.

It's a good rule for anything that shares data with its neighbors. You can leave the vendor. You can't unilaterally leave the format — not while something you rely on still speaks it.

---

`peek` is a verb for a viewer. `weft` is a noun for a fabric. The tool had been weaving for months — I just hadn't called it that.

The rename didn't change what it does. It changed what I'm willing to let it become.
