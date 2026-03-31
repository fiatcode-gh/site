---
title: "Self-Hosting LibreChat: Own Your AI Stack"
description: "When Claude's quotas tightened and the AI landscape got political, I stopped renting intelligence and built my own"
date: 2026-03-31T18:00:00+07:00
draft: false
tags:
  - self-hosting
  - ai
---

In late February 2026, OpenAI signed a contract with the Pentagon to deploy its models on classified military networks. Within 48 hours, ChatGPT uninstalls surged 295%. Two and a half million people joined the QuitGPT boycott. Claude hit #1 on the US App Store for the first time.

Anthropic wasn't ready for that.

By late March, Anthropic quietly tightened Claude's session limits to manage the infrastructure strain. If you were a heavy user — which I was — you started hitting walls mid-conversation. The irony wasn't lost on me: I'd fled one dependency only to land harder in another.

That's when I decided to stop renting intelligence and build my own setup.

---

### What LibreChat Is

[LibreChat](https://librechat.ai) is an open-source, self-hostable AI chat interface. It looks and feels like ChatGPT, but you bring your own API keys and run the whole thing on your own server. It supports any OpenAI-compatible endpoint — which means you can point it at any inference provider, not just OpenAI.

The separation is clean: LibreChat is the interface, your inference provider handles the models, your server is the host. If a provider's pricing changes or a better option shows up, you swap the endpoint. Nothing is locked in.

---

### The Model Lineup

I went with [DeepInfra](https://deepinfra.com) as my inference provider. It's pay-per-token with no monthly subscription and a wide catalog of open-weight models.

| Model                 | Use case              | Cost (per 1M tokens)  |
| --------------------- | --------------------- | --------------------- |
| **MiniMax-M2.5**      | General chat          | $0.20 in / $0.20 out  |
| **GLM-5**             | Heavy reasoning       | $0.80 in / $2.56 out  |
| **Qwen2.5-72B**       | Reasoning alternative | ~$0.35 in / $0.40 out |
| **Qwen2.5-Coder-32B** | Code tasks            | $0.15 in / $0.15 out  |
| **Llama-3.1-8B**      | Quick queries         | $0.06 in / $0.06 out  |

---

### Picking the Right Model for the Job

Most conversations don't need a frontier model. For casual questions, summarization, brainstorming, or anything where you'd be happy with a good-enough answer — MiniMax-M2.5 handles it comfortably. It's a 456B MoE model with about 46B active parameters and a 1M token context window. At $0.20/M tokens, it outperforms most 70B-class models at a lower price. That's the daily driver.

GLM-5 is what I reach for when the problem actually needs to be solved correctly. It currently ranks #1 among open-weight models on reasoning benchmarks — 86% on GPQA Diamond, 92.7% on AIME 2026. It's expensive by comparison ($2.56/M output tokens), but for tasks where the answer matters and errors are costly, the price difference is irrelevant.

Qwen2.5 Coder 32B is the light coder. It handles simple tasks — writing a utility function, fixing a syntax error, generating boilerplate — without burning through tokens at GLM-5 prices. MiniMax and GLM-5 are actually stronger coders overall, so for anything complex: an architecture decision, a tricky bug, a non-trivial refactor — I switch to one of those. Qwen Coder is for when the task is straightforward enough that reaching for the heavy hitter would be overkill.

The 8B model handles title generation in the background — the small automated task that runs after every conversation. There's no reason to burn the expensive models on naming conversations.

---

### What You Actually Get

Once it's running, it's a proper chat interface. Web search is wired in — there's a toggle per conversation, and when it's on, the model pulls live results and cites them inline. It's not always necessary, but for anything time-sensitive it's the difference between a confident wrong answer and an accurate one.

Memory works similarly. LibreChat uses a small background model to extract things worth remembering from your conversations and builds a persistent profile over time. After a few sessions, it starts to carry context you'd otherwise have to re-explain — your projects, preferences, recurring topics. You can view and edit the memory store directly if it picks up something wrong.

File uploads let you drop in documents and ask questions against them. This uses a local vector database to store embeddings — so document retrieval happens on your server, not someone else's. The RAG pipeline is basic but functional for personal use.

The model picker is always visible. Switching mid-conversation is two clicks. This turns out to matter more than I expected — it's easy to start a conversation with the cheap model and escalate to the heavy one when the problem turns out to be harder than it looked.

---

### The Irony

The entire setup — architecture decisions, configuration, debugging — was built using Claude Code.

I used Claude to escape Claude's limits. I'm not sure what that says about anything, but I find it genuinely funny.

---

### Is It Worth It?

For light users: probably not. A Claude Pro subscription is simpler, and the models are excellent when they're available.

For heavy users who actually push the session limits: the math works in your favor surprisingly quickly, and there's something valuable beyond cost. You understand what's running, you can fix what breaks, and you're not subject to someone else's capacity planning decisions or policy changes. The QuitGPT moment was a reminder that the ground can shift under you without warning. Owning the stack means that shift becomes someone else's problem.

I built this in an afternoon. The frustrating part wasn't the work — it was realizing I should have done it sooner.
