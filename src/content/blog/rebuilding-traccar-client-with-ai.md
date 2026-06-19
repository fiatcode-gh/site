---
title: "I Fed the Official Traccar Client to AI and Rebuilt It"
description: "The official app is built in the same Flutter I'd use. So its bugs and its UI weren't the framework's fault — they were choices. I made different ones."
date: 2026-06-18T14:10:00+07:00
draft: false
tags:
  - ai
  - flutter
  - android
---

## The official client is the same stack I'd reach for. That's exactly why I couldn't leave it alone.

I self-host Traccar to keep track of a few devices. The server is great. The official Android client that feeds it — less so. It works, mostly, but I kept hitting small bugs, and the UI never gave me a reason to want to open it.

For a while I assumed that was just the cost of a cross-platform tracker. Then I went and looked at the source, and the assumption fell apart.

The official client isn't some crusty native app. Traccar [rewrote it in Flutter](https://github.com/traccar/traccar-client) — one codebase across Android and iOS. Flutter is what I reach for at work most days. So the bugs and the flat UI weren't a framework limitation I had to accept. They were choices. And if they were choices, I could make different ones.

So I did the obvious 2026 thing. I cloned the repo, handed the whole thing to Claude, and rebuilt it to my own standard.

---

### Rebuilding something that already works

"It already exists and runs" is usually a good reason _not_ to build your own. The honest version of why I did it anyway:

- The bugs were small but persistent — the kind that erode trust in a tool that's supposed to run silently for days.
- The UI was generic. For an app whose entire job is to show me a coordinate and a status, generic is a missed opportunity.
- The source was right there, open, and in a stack I know.

That last point is the one that changed the math. A year ago, "rebuild the client to my taste" meant reading an unfamiliar codebase end to end before I could change a line. That's a weekend gone before any real work starts.

Feeding an existing codebase to an AI is a different mode than greenfield. There's no blank page to fill — there's a reference implementation that already encodes every protocol detail, every Android permission quirk, every edge case the original authors hit. The AI's first job isn't to invent. It's to _read_, explain the architecture back to me, and then help me decide what to keep.

That distinction turned out to be the whole story.

---

### The reference implementation is a gift and a trap

Claude read the Traccar client far faster than I could have. Within a session I had a clear map: how it talks to the server, how it requests background location, how the foreground service stays alive. The protocol details — the exact query-string format Traccar expects, the `is_moving` flag, basic-auth headers — came straight across, correct, because they were sitting right there in the original.

That's the gift. The trap is that an AI will faithfully reproduce _everything_ — including the parts you wanted to leave behind.

I rebuilt the app with a cleaner split than I'd have managed by hand: a thin Flutter UI shell over a native Kotlin core, organized into `location/`, `network/`, `service/`, and `storage/` modules instead of one monolith. The Dart side talks to Kotlin through a single bridge. But poke around the native code and you'll still find this:

```kotlin
private const val CHANNEL = "com.traccar.client/tracking"
```

That channel name is a fingerprint. It's the original's package, still wired into my rebuild because nothing forced me to rename it and the AI had no reason to. A small thing — but a good reminder that "rebuilt from scratch with AI" is doing a lot of quiet lifting. Plenty of the bones are inherited. The judgment is in deciding which bones to keep.

---

### The AI port broke the core, fast

Here's the part the demo-day version of AI coding skips.

The first working build looked complete. It compiled, it launched, the UI rendered. And it didn't report a single location to the server. My third commit on the project is literally titled:

```
fix: critical bugs preventing location reporting to server
```

This is the AI failure mode I've [written about before](/posts/vibe-coding-still-needs-a-craftsman) showing up in the wild. The generated code _looked_ correct — it had all the right method names, the right callback shapes, a plausible service lifecycle. It was confident. It was also broken in a way that only surfaces when you actually run it against a real server and watch nothing arrive.

No test catches that for you when the whole thing is platform channels and a foreground service talking to GPS hardware. You catch it by running it on a real phone, in the real world, and noticing the dot on your map isn't moving.

---

### Where the AI needed a craftsman

The interesting decisions weren't the ones the AI made — they were the ones it would have gotten wrong if I'd let it autopilot.

The clearest example is the heartbeat. The app needs to wake periodically and report a location even when the device is sitting still, so the server doesn't mark it stale. The textbook Android answer in 2026 is WorkManager, and that's where an unsupervised agent drifts by default — it's the "modern, recommended" API, so it pattern-matches to it.

It's the wrong call here, and there's a comment in the code saying why:

```kotlin
// HeartbeatScheduler uses AlarmManager
// (not WorkManager — callbacks lost in separate process)
```

WorkManager runs work in a context where the static callbacks this design relies on get lost. The right tool is a plain `AlarmManager` with `ELAPSED_REALTIME_WAKEUP`. That's not a fact you derive from first principles in a prompt — it's a scar from having shipped background Android code before. The AI wrote the implementation; I made the call about _which_ implementation, and the comment exists so future-me doesn't "modernize" it back into a bug.

Same story with speed. The GPS chip doesn't always report a speed value, and the original just let that be null. I wanted a real number, so I added a fallback: take two fixes about 2.5 seconds apart and compute speed from the distance over time. Claude wrote that calculator quickly.

Then it bit me — a `Handler` leak, a race condition, and a duplicate location send, all in the new speed code. One commit (`b5fabd9`) to clean up three bugs the AI introduced by writing exactly the kind of timing-dependent code that looks fine and isn't. The feature was my idea. The bugs were the AI's. The fix was mine. That division of labor is the actual shape of building this way.

---

### The bug that taught the best lesson

My favorite fix in the whole history isn't even a flashy one:

```
fix: remove 24h event log cleanup that caused log loss on service restart
```

The app keeps a detailed event log — every location send, sync, network change, error, color-coded so I can actually debug what the tracker did overnight. At some point a "clean up logs older than 24h" routine got added. Sensible on its face. Except it ran on service restart, and a background tracker restarts more than you'd think — so the logs I most wanted, the ones from right before something went wrong, were the ones getting wiped.

It's a tidy little parable for AI-assisted work. The cleanup code was reasonable in isolation. It was wrong in the context of how the app actually lives on a device. Reasoning about _running behavior over time_ — not just "is this function correct" but "what does this do to the system after three days of real use" — is still the human's job. The AI optimizes the line in front of it. You have to own the runtime.

---

### Making it not ugly

Taste is the part AI does not hand you for free.

I gave the app a dark terminal aesthetic — near-black `#0d0d0d`, monospace everywhere, a teal `#00bcd4` accent with a green pulse when tracking is live. The main screen is a status readout: latitude, longitude, speed in km/h, last timestamp, and one big toggle. The event log reads like a console. It looks like an instrument, not a Material template, and that was the entire point of rebuilding it.

None of that came from a prompt like "make it look good." It came from picking a direction and then dragging the details there one commit at a time — fixing a white flash on dark-theme transitions, reworking the permission screen to request location in the order Android actually demands (when-in-use first, then always), turning the log into readable two-line entries with a filter bar. The AI executed each of those fast. None of them would have happened without someone deciding they mattered.

---

The official client and mine are the same framework, talking to the same server, in the same language. Strip away the rebuild and that's almost provocative — what was the point, if the stack is identical?

The point is everything the stack doesn't decide for you. Which background API to trust. What to log and what to never delete. Whether a null speed is acceptable or worth two GPS fixes to fix. Whether the screen looks like an instrument or a form.

AI made the rebuild cheap enough to be worth doing — cheap enough that "I'd just do it better myself" stopped being a fantasy and became an afternoon. But cheap isn't the same as good. The reason my version is better isn't that an AI wrote it. It's that I decided what not to carry over.

The craftsman gets leverage. The leverage doesn't get taste.

---

TracPulse lives at [git.fiatcode.dev/fiatcode/tracpulse](https://git.fiatcode.dev/fiatcode/tracpulse).
