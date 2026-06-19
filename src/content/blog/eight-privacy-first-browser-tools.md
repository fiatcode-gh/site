---
title: "Eight Privacy-First Browser Tools, Zero Network Requests"
description: "Every online dev tool says it doesn't upload your data. I wanted a set where you can open the network tab and prove it."
date: 2026-06-19T14:40:01+07:00
draft: false
tags:
  - ai
  - dev-setup
---

## Every JWT debugger and JSON formatter online swears it runs locally. You can't actually check. So I built eight tools where you can.

You paste a production JWT into a decoder to check why a token's expiring early. You drop a JSON blob into a formatter. You upload a photo to "strip its metadata before posting." Every one of those sites has a line in the footer — _all processing happens in your browser, nothing is uploaded_ — and every one of those lines is a promise you have no way to verify.

Most of them are probably telling the truth. But "probably" is doing a lot of work when the input is a signed token or a photo with GPS coordinates in it.

fiatcode is a privacy-first, local-first identity. A pile of tools that ask you to _trust_ they're private would be the wrong thing to ship under that name. So I built eight that don't ask — they're checkable. Open the network tab, use the tool, watch nothing happen.

---

### The promise has to be falsifiable

The whole design rests on one constraint: zero network requests at runtime, on every tool page, verifiable by anyone who cares to look.

That's not a vibe. It's a property you can test. Open `/tools/jwt`, paste a token, and watch the network panel stay empty. No XHR, no `fetch`, no beacon firing off to an analytics endpoint when you're not looking. The fonts are self-hosted. There's no CDN script. The search index — Pagefind, which the rest of the blog uses — is scoped so it never even loads on a tool page.

Every library that needed bundling is pinned to an exact version and built into the page, never pulled from a CDN at runtime. A CDN call is a network call, and a network call is the thing I'm promising doesn't happen.

The eight tools, all client-side, all on the [`/tools`](/tools) hub:

- **Base64** — encode/decode, UTF-8 safe, with a file-to-base64 mode
- **JSON formatter** — pretty-print, minify, validate with the error's line and column
- **UUID / ULID** — generate v4 UUIDs and ULIDs, one or in bulk
- **JWT decoder** — decode header and payload, flag expiry; it never claims to _verify_ the signature, because decoding isn't verification
- **Regex tester** — live match highlighting, capture groups, replace preview
- **EXIF stripper** — see an image's metadata, then download a copy with all of it gone
- **Cron explainer** — turn a cron expression into plain language and its next run times
- **QR generator** — text or URL to a downloadable SVG or PNG

None of them are novel. The novel part is that you can prove the privacy claim instead of taking it on faith.

---

### How a canvas re-encode launders a photo clean

The EXIF stripper is the one where the privacy promise stops being abstract. People drop phone photos into these — and phone photos carry GPS coordinates, the exact timestamp, the camera model, sometimes a thumbnail of the original frame.

The trick that strips all of it is a `<canvas>` re-encode. You draw the decoded image onto a canvas and read it back out as a fresh file. The canvas only holds pixels — none of the original file's metadata segments survive the round trip. No parsing library, no allowlist of tags to scrub, no chance of missing a field a new camera invented last month. The metadata simply isn't in the output, because the output was built from pixels.

The tool _does_ read the metadata first, with a bundled parser, but only to show you what was there before it's gone. That preview is the honest part: here's the GPS fix and the camera serial that were in your file. Now here's the clean copy.

And because it all happens on a canvas in your tab, the photo never leaves the machine. That's not a policy. It's the architecture.

---

### I built it with a subagent crew, and the reviews earned their keep

I ran this the way I run most things now — [structured AI agents, not vibe coding](/posts/vibe-coding-still-needs-a-craftsman). A plan broken into tasks, each task implemented by a fresh agent, then reviewed by two more: one checking it matched the spec, one checking the code was actually good. Test-driven throughout. The pure logic — base64 round-trips, the ULID encoder, JWT claim parsing — got real unit tests before any UI existed. Seventy-nine of them by the end.

The reviews weren't ceremony. They caught four bugs that would have shipped, and the interesting thing is that the worst ones were all the same _shape_ — code that looked correct and ran fine in the happy path.

The EXIF stripper downloaded portrait phone photos **rotated sideways**. A phone stores the image in landscape and adds an orientation tag saying "rotate this 90°." My canvas re-encode stripped the tag — correctly, that's the job — but I'd decoded the image without applying the rotation first, so the cleaned copy lost the only thing telling it which way was up. One option flag fixed it: bake the orientation into the pixels _before_ you discard the tag. But nothing in the happy path would have shown me — it only bites portrait photos, and only on some browsers.

The UUID generator served the same "random" IDs to every visitor. Astro pre-renders these tools into static HTML at build time, and I was generating the initial batch of IDs at the top of the component — which runs at build time. So the build baked five specific UUIDs into the page, and every visitor got those five until the page hydrated. For a tool whose entire job is unique identifiers, that's a quietly absurd bug. The fix was to generate only after the component mounts in the browser, but the lesson is sharper than the fix.

The JSON formatter froze the tab for 28 seconds. To show you the line and column of a parse error, it scanned the input — and the scan was accidentally quadratic, re-running on every keystroke. On a 100KB paste of invalid JSON, that's a 28-second freeze per character typed. Capped the scan length and it's instant; the line number just gives up gracefully on enormous inputs.

The QR generator silently produced unscannable codes. The margin input had a min of zero, but HTML number inputs don't actually enforce that on typed values — type `-5` and the encoder cropped the matrix into garbage with no error. Clamping the value in the logic, not trusting the input attribute, fixed it.

Four bugs, all of them the kind that pass a casual click-through. The thing they share: AI-generated code is confident and syntactically clean, and it handles the case you were thinking about. The cases you weren't thinking about — the portrait photo, the build-time render, the 100KB paste, the typed-over-the-min value — are exactly where a second reader earns their cost.

---

### Verify the thing you can verify

There's a smaller lesson buried in the build, and it's the one I keep relearning: don't trust your own knowledge about a fast-moving tool, check it.

Two examples from one afternoon. The Svelte adapter version my plan assumed turned out to require the _next_ major of Astro — the agent hit the dependency conflict immediately and I repinned it. And the JSON error locator was built around a regex that scrapes the line number out of the browser's error message — except Node 24's JavaScript engine had dropped that detail from the message entirely, so the regex matched nothing and a fallback had to do the work.

Both were caught because something concrete failed loudly — a peer-dependency error, a test — not because I remembered correctly. I didn't remember correctly. The verification did the remembering.

That's the same instinct as the whole project, scaled down. The privacy claim is real because you can open the network tab. The orientation fix is real because the test round-trips a known image. The version is right because the install failed when it was wrong. A promise you can check is worth more than a promise you have to believe — whether it's "nothing is uploaded" or "this is the right version" or "the photo isn't rotated."

The footer on those other tools probably isn't lying. But "probably" isn't a feature. Checkable is.

Open the [tools](/tools). Then open the network tab and watch them do nothing.
