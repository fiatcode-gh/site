---
title: "Stop Stashing. Use Git Worktree."
description: "Switching branches to review a PR shouldn't cost you your mental context. It doesn't have to."
date: 2026-03-26T00:00:00+07:00
draft: false
tags: ["git", "dev-setup"]
---

## Switching branches to review a PR shouldn't cost you your mental context. It doesn't have to.

There's a workflow tax that most developers pay without thinking about it. A PR comes in that needs review. You're mid-feature. The code isn't commit-ready. So you stash it, switch branches, pull the PR branch, do the review, switch back, unstash — and spend the next ten minutes remembering where you were.

Every time.

I stopped paying that tax when I discovered `git worktree`. And I discovered it in the least expected way — by watching an AI agent use it without asking for permission.

---

### How I Found Out

I had Claude Code running an agentic task on a feature branch — refactoring a module, taking its time. Mid-run, I needed to check something on `main`. I expected it to either block me or make a mess.

Instead, it created a worktree. Spun up a sibling directory, checked out the branch it needed there, did its work, and cleaned up after itself. My working directory was never touched.

I stopped the agent and read back through what it had done. `git worktree add`, `git worktree remove`. Commands I had technically seen before and never internalized.

That's the thing about AI agents doing work in your repository — they're not constrained by the habits you've built up. They don't stash because that's what you've always done. They reach for the right tool. Sometimes watching that is the fastest way to learn one exists.

---

### What It Actually Does

A git repository has one working tree by default: the directory you cloned into, with one branch checked out at a time.

Worktrees let you attach additional working directories to the same repository. Each one gets its own branch, its own index, its own `HEAD`. They all share the same commit history and object store. No duplication, no second clone.

You can be on `feature/auth` in one terminal and `hotfix/payment-bug` in another. Both are live. Neither knows the other exists.

---

### The PR Review Problem, Solved

Here's the workflow that actually changed things for my team.

**Before worktrees:**

1. Get a PR review request
2. Stash current changes (or commit a messy WIP)
3. `git checkout` the PR branch
4. Review, comment, test
5. Switch back, unstash, reorient

The stash step sounds minor. It isn't. Stash is a footgun — easy to forget, annoying to name, occasionally painful to pop. And the mental context switch is real. You come back to your feature and spend time reconstructing what you were about to do.

**After worktrees:**

```bash
git worktree add ../pr-42 origin/their-branch
code ../pr-42   # open in a new editor window
```

That's it. Your original working directory is untouched. No stash, no branch switch, no context lost. When you're done:

```bash
git worktree remove ../pr-42
```

---

### The Commands Worth Knowing

**Add a worktree for an existing branch:**

```bash
git worktree add ../feature-x origin/feature-x
```

**Add a worktree and create a new branch at the same time:**

```bash
git worktree add -b hotfix ../hotfix-dir main
```

**See all active worktrees:**

```bash
git worktree list
```

**Clean up a worktree when done:**

```bash
git worktree remove ../feature-x
git worktree prune   # removes stale metadata
```

---

### Conventions That Help

A few things that make worktrees less messy in practice:

**Name by PR number or branch.** `../pr-42` or `../wt-feature-auth` makes it obvious what each directory is for and easy to clean up later.

**Open in a separate editor window.** `code ../pr-42` keeps the two contexts visually separated. No confusion about which branch you're editing in.

**Keep them outside the main repo directory.** Putting worktree directories as siblings to the main repo (e.g., `../`) keeps your project folder clean and avoids accidental `.gitignore` conflicts.

**Clean up regularly.** `git worktree list` and `git worktree prune` occasionally — especially after remote branches get deleted post-merge. Stale worktree metadata isn't harmful, but it clutters the list.

---

### One Constraint to Know

The same branch can't be checked out in two worktrees at once. Git will refuse it. This is intentional — two worktrees writing to the same branch would create conflicts at the index level.

In practice this is rarely a problem. Worktrees are usually short-lived: spin one up for a review or a parallel experiment, remove it when done.

---

### Why This Matters More Than It Looks

The friction of switching contexts isn't just annoying — it has a compounding cost. On an active team where PR reviews are expected to be fast, that tax accumulates. People start batching reviews, or letting them sit, or doing shallow reviews just to get back to their work.

Worktrees remove the cost of context switching. Reviews happen sooner, with more depth, because the developer isn't sacrificing their own flow to do them.

It's a small tool with a disproportionate effect on how a team actually works.

Add it to your workflow. You won't miss the stash.
