---
title: "Vibe Coding Still Needs a Craftsman"
description: "AI agents can write code faster than you ever will. That doesn't mean you can stop thinking."
date: 2026-03-25T00:00:00+07:00
draft: false
tags: ["ai", "software-craftsmanship", "tdd", "ddd", "clean-architecture"]
---

## AI agents can write code faster than you ever will. That doesn't mean you can stop thinking.

My office has been deep in AI-assisted coding for a while now. Claude Code, agentic workflows, context-aware completions — the works. Productivity is up. Shipping speed is up. Everyone is excited.

And yet, some of the code that comes out of it is quietly terrifying.

It works. Mostly. But crack it open and you find a tangle of implicit dependencies, logic scattered across layers it has no business touching, and test coverage that's either zero or cosmetic. It runs fine in the demo. Whether it survives six months of production changes is a different question.

After watching this pattern repeat a few times, I've started forming a clearer opinion: AI coding agents are a force multiplier. And force multipliers amplify what's already there — the good _and_ the bad.

---

### Vibe Coding Has a Skill Floor

There's a misconception that AI coding tools lower the barrier to entry to zero. That if you can describe what you want clearly enough, you'll get working software.

You will get _running_ software. Working is a higher bar.

No code experience means no ability to review what the AI produces. You can't spot a hidden N+1 query, a missing transaction boundary, or a service that's doing five things at once and calling itself "clean." The code compiles, the tests pass if there are any, and it ships — until the edge case that wasn't in the prompt surfaces at 2am.

Understanding code is still the job. AI doesn't change that. It changes where you spend your time.

---

### The Work Shifts, It Doesn't Disappear

Here's what actually happens when you add a capable AI agent to a development workflow: the cost of writing code drops dramatically. The bottleneck moves.

It moves to planning. To architecture. To understanding what you're actually building before the first line is generated. Because the AI will happily build the wrong thing at incredible speed if you let it.

This is a good shift, actually. Writing code was never the hard part. The hard part was always figuring out what to write and how to structure it so you could change it later. AI just makes it more obvious that those are the things that matter.

Clean Architecture, TDD, DDD — these aren't just process overhead that slows you down. They're load-bearing walls. Remove them and the structure falls faster, not slower, because now you're generating technical debt at machine speed.

---

### DDD Makes the AI a Better Collaborator

This one surprised me when I first noticed it.

Domain-Driven Design forces your code to speak the language of the problem domain. Entities, value objects, aggregates, bounded contexts — these are names and boundaries that mirror how the business actually works. The code reads like documentation.

When you feed that kind of codebase to an AI agent, something useful happens: the AI can actually reason about it. It understands that an `Order` can't be mutated after it's been `Confirmed`. It knows that a `Payment` belongs to a bounded context that doesn't reach into `Inventory`. It has vocabulary to work with.

Compare that to a codebase where a `UserManager` handles authentication, profile updates, notification preferences, and billing status. The AI has no conceptual map. It guesses. Sometimes well, usually not.

DDD doesn't just help humans read code. It helps AI write better code.

---

### TDD Keeps the AI Honest

AI-generated code has a particular failure mode: it looks correct. It's syntactically clean, it handles the happy path, and it's confident. The tests, if they exist, often test the implementation rather than the behavior.

Test-Driven Development flips the order. You define the expected behavior first — in executable form. Then the implementation exists to satisfy those tests. The AI can write the implementation, but the tests are the spec, and the tests were written by a human who understood what "done" actually means.

There's a second benefit: the test suite becomes living documentation. Not a README that drifts out of sync over time, not inline comments that lie about what the code does — actual runnable proof of what the system is supposed to do. Six months from now, when nobody remembers why a particular rule exists, the test case will still be there explaining it.

---

### Give the Agent a Conscience

The final piece is tooling — specifically, how you configure the agent itself.

Most AI coding agents support system prompts, custom instructions, or something similar. This is where you encode your standards. Not just "write clean code" (that's useless), but specific, executable constraints:

- Plan before implementing. Write a numbered implementation plan. Wait for approval before touching code.
- Follow the architectural boundaries defined in the project. No cross-layer dependencies without explicit justification.
- All new logic must have a corresponding test. Red before green.
- Domain objects use domain language. No `Manager`, no `Handler`, no `Util`.

An agent with clear constraints operates like a senior developer who has internalized the team's standards. An agent without them operates like an intern with unlimited caffeine and no code review process.

The constraint file is worth writing. It's a few hours of thought that pays back on every single task the agent runs.

---

### The Craftsman Isn't Replaced

The pitch for AI coding tools is usually about speed. More features, faster shipping, less time writing boilerplate. That's all real.

But the thing that doesn't get said enough: the value of a developer who understands what they're building, can reason about tradeoffs, and knows how to structure a system for change — that value just went up. Because now that developer can execute at a pace that used to require a team.

The craftsman isn't replaced. The craftsman gets leverage.

Use it carefully.
