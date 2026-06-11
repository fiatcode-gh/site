---
title: "Bringing CI Home: Forgejo Actions on a Rootless Podman Runner"
description: "I self-host my git, my API, even my notes — my Flutter builds were the last thing still running on someone else's Macs"
date: 2026-06-09T16:36:40+07:00
draft: false
tags:
  - self-hosting
  - dev-setup
  - flutter
---

## CI was the last rented link in an otherwise self-hosted stack. So I brought it home.

I came back to [Kuwot](https://play.google.com/store/apps/details?id=com.dhemasnurjaya.kuwot) — my daily-quote app — to push a small update. The reason was mundane: I'd moved its API to a new server and domain a while back, the old host had finally gone dark, and the app on the Play Store was still pointed at a ghost. A fresh build with the new host would fix it. Five minutes of work.

Then I opened the project and remembered how it shipped: [Codemagic](https://codemagic.io). A hosted CI service, building my app bundles on managed Macs in someone else's data center.

And it struck me. I self-host my git now — [Forgejo](https://forgejo.org), on my own box. I self-host the API. I self-host my notes, my chat models, my music. Codemagic was the last rented link in the chain. The five-minute update turned into a question I couldn't unask: why is my build the one thing I don't own?

So I brought it home.

---

### The insight: the runner doesn't live on the server

What had kept me from self-hosting CI was a wrong mental model. I pictured a runner as a daemon I'd have to wedge onto my VPS — the same small box already running Forgejo, Traefik, and the Kuwot API. It doesn't have the headroom to also compile Android bundles, and I didn't want it trying.

But a Forgejo Actions runner doesn't work that way. It's an outbound agent: it polls the Forgejo instance for jobs and runs them wherever it happens to live. It never takes an inbound connection, and it doesn't need to share a machine with Forgejo at all.

Which means the build compute can be anything. In my case, my own workstation — a Fedora laptop with actual RAM and cores. Flutter Android builds are heavy: Gradle, the Android SDK, multi-gigabyte memory spikes. A workstation eats them for breakfast where a small VPS would thrash. The VPS keeps doing its job at exactly the load it had yesterday, and the builds happen on a machine that's actually good at building.

Once that clicked, the rest was just setup.

---

### Rootless Podman as the backend

On Fedora I run [Podman](https://podman.io), not Docker — daemonless, rootless, no background service holding root. The Forgejo runner talks to a Docker-compatible API socket, and Podman exposes exactly that. So the whole thing runs as my user, no daemon, no `sudo`:

```fish
systemctl --user enable --now podman.socket
```

That gives me a socket at `unix:///run/user/1000/podman/podman.sock`, and the runner config points straight at it. Jobs run in containers Podman pulls and manages, entirely in user space.

One real trap here, and it's a documentation trap: nearly every guide tells you to run `forgejo-runner register` to write a `.runner` credentials file. That command is gone. Forgejo 15's runner is fully declarative — you create the runner in the web UI, copy the UUID and token, and drop them into `config.yml` under `server.connections`. No register step, no `.runner` file. I burned a few minutes following stale tutorials before I read the generated config and realized the model had changed underneath them.

```yaml
server:
  connections:
    forgejo:
      url: https://git.fiatcode.dev/
      uuid: <from the UI>
      token: <shown once>
```

Wrap that in a `systemctl --user` service and the runner comes online, polls, and sits idle waiting for work.

---

### The yak-shave I didn't plan for

Here's where the "five-minute update" showed its true size. A handful of things that did not go clean:

**Codemagic left a landmine in my signing config.** My `android/app/build.gradle` had a release-signing block that branched on `if (System.getenv("CI"))` to pick up Codemagic's managed keystore. Forgejo's runner _also_ sets `CI=true`. So on Forgejo that branch fires with all of Codemagic's specific variables empty — a broken or unsigned build. I rewired it to read generic `KEYSTORE_*` env vars, falling back to a local `keystore.properties` for desk builds. `CI=true` is universal; a CI-_specific_ branch keyed on it is a trap waiting for the next CI.

**Third-party actions need full URLs.** Forgejo resolves a bare `actions/checkout@v4` from its own registry at `code.forgejo.org`, not GitHub. So `subosito/flutter-action`, which lives on GitHub, had to be spelled out as `uses: https://github.com/subosito/flutter-action@v2` — or it 404s.

**I built the whole thing on the wrong branch.** This one's on me. I did the entire migration on `main`, ran the tests, felt good — then went to open a PR and found `dev` was seven commits ahead. `main` was a stale snapshot; `dev` was the real trunk. I'd been working against a baseline that was already behind, and had to redo the work on top of `dev`. The lesson is embarrassingly simple: before you branch for a feature, check the repo's actual default branch (`origin/HEAD`) — don't trust whatever happens to be checked out.

**Signed tags need a message.** I sign my git tags with SSH. `git tag v1.2.29+29` failed with a cryptic `no tag message?` — because a signed tag is an annotated tag, and annotated tags want `-m`. Two seconds to fix once you know; a minute of head-scratching when you don't.

None of these were hard. All of them were the kind of thing a hosted service quietly handles for you — and the kind of thing you only learn by owning the pipeline.

---

### Tags are the release, so I deleted a branch

With the new pipeline, releases are driven by tags. Push one matching `v*` and the runner builds a signed bundle and hands it back as an artifact. The tag carries the version — I use Flutter's own `name+code` string, so `v1.2.29+29` becomes versionName `1.2.29`, versionCode `29`.

Which made me look at my branches and notice the `main`/`dev` split was dead weight. The whole point of a Git-Flow `dev` branch is to keep a pristine `main` that mirrors what's released. But the tag already does that — `v1.2.28+28` is an immutable, checkoutable pointer to exactly what shipped. A second long-lived branch was solving a problem the tags had already solved.

So I collapsed to a single `main` trunk and retired `dev`. For a solo project, the ceremony wasn't earning its keep. When I want a review gate I still branch and open a PR — but the default is now: commit to `main`, and when it's ready, tag it.

One constraint the Play Store enforces, and the tag has to honor: `versionCode` must strictly increase. The live build was `28`, so the next is `29`, encoded right in the tag. Get it wrong and Google rejects the upload — so the workflow fails fast if a tag forgets its `+code`.

---

### What I have now

`git tag v1.2.29+29 && git push` produces a signed Android App Bundle, built on my own hardware, with no SaaS anywhere in the loop. I download the artifact and upload it to Play by hand — the one manual step I left in, because auto-publishing to the store is a bridge I'll cross when I'm tired of the click.

The side benefit I didn't plan for: the runner is registered at the site level, so it serves every repo on my Forgejo, not just Kuwot. One laptop runner, and all my projects have CI. Next time I want a pipeline there's nothing to stand up — just add a workflow file.

I self-host my git, my API, my notes, my models. The thing that builds them runs on my own laptop now — no Macs in the cloud, no quotas, no rented link. It didn't cost me a server, just a socket on hardware I already owned.

Just a tag and a push.
