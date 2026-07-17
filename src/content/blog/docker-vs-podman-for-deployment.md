---
title: "Docker vs Podman for Deployment: The Daemon Was Never the Feature"
description: "I moved fourteen self-hosted services off Docker Compose. The thing I thought I'd miss — the daemon — turned out to be the thing I was glad to lose"
date: 2026-07-17T18:45:00+07:00
draft: false
tags:
  - self-hosting
  - podman
  - linux
---

## For long-running services you own, Podman's daemonless, systemd-native model beats Docker's — and the daemon you'd supposedly miss is a liability, not a feature.

I run fourteen services on a single Netcup VPS — Traefik out front, Authelia, Forgejo, Vaultwarden, Navidrome, a few of my own APIs. For years they ran on Docker Compose. Last week I moved the whole thing to rootless Podman.

The question worth answering isn't whether Podman *can* run my containers — of course it can, it's OCI all the way down. It's whether Podman is actually *better* for deployment, or just a rootless novelty you adopt on principle and quietly regret.

Having done it, I'll take a position: for deploying long-running services on a box you own, Podman's model is the better one, and Docker's defining feature — the daemon — is the specific thing you're better off without.

---

### The daemon is the whole argument

Docker is a daemon. `dockerd` runs as root, owns every container, and the `docker` CLI is just a client talking to it. That architecture is Docker's identity, and for deployment it's the central liability.

A root daemon is one always-on privileged process. Compromise it and you're root on the host. Anyone in the `docker` group is effectively root already. On a box facing the public internet running fourteen services, that's a lot of blast radius pooled in one place.

Podman has no daemon. `podman` runs the container directly, as your user, rootless by default. There's no privileged process sitting around to compromise and no `docker`-group-equals-root footgun. A container that escapes escapes into an unprivileged user, not into root.

Docker has bolted on a rootless mode too — worth being fair about — but it's still a daemon, just a less-privileged one, and it's opt-in against a decade of tooling that assumes the root socket. Podman started daemonless and rootless. One of these is a design; the other is a retrofit.

The usual objection: no daemon means nothing's running to restart your containers or bring them up at boot. True — and it's the best thing about the whole move, because Podman hands that job to something far better at it.

---

### Your services become systemd units

This is the part that actually sold me, and it's the thing Docker has no real answer to.

A Podman quadlet is a `.container` file that is, essentially, a systemd unit. systemd reads it and runs the container. Which means every service on my stack is now a first-class systemd unit — with boot ordering, restart policy, dependency graphs, journald logging, and `systemctl status`, all inherited for free from the init system that's already running everything else on the machine.

Look at what Compose does instead. It reinvents that slice of systemd — its own restart policies, its own `depends_on` ordering, its own up/down lifecycle — in a YAML dialect only Compose understands, driven by a daemon that has to stay healthy for any of it to hold. It's an init system living inside a container tool, parallel to the real one running three inches away.

Under quadlets that whole layer is gone. `systemctl --user restart forgejo`. `journalctl --user -u forgejo -f`. The entire stack is one systemd target — a reboot brings all fourteen services back, in dependency order, with zero intervention, because bringing ordered units up at boot is precisely what systemd has done since 2010.

Deployment *is* lifecycle management of long-running processes. Linux already ships an excellent tool for that. Podman lets you use it; Compose asks you to run a second one.

---

### Less surface to defend

The daemonless model quietly deletes things you used to have to secure.

Under Compose, Traefik discovered my services by reading the Docker socket. But the Docker socket is root on the host, so I ran a `docker-socket-proxy` container in front of it to whitelist only the read-only calls Traefik needed — a whole extra container and threat model existing solely to make Docker's discovery mechanism safe to expose. With no daemon to query, routing moved to static config files, and the socket-proxy simply ceased to exist. One fewer container, one fewer thing that can go wrong.

There's even an upside where I expected a downside. Rootless container networking normally costs you the real client IP — the userspace network stack NATs the source address, so every request looks like it came from a bridge gateway. Podman lets systemd hold ports 80 and 443 and hand the open sockets to Traefik directly (socket activation), and traffic arriving that way skips the NAT entirely. Real client IPs in the logs, from a rootless proxy. Docker's rootful default gives you that; I assumed rootless would take it away. It didn't.

---

### The cost: Podman refuses to paper over

Now the honest half, because none of this is free.

Docker is *forgiving* in ways you stop noticing until they're gone. It creates missing bind-mount directories for you. It sets friendly in-container defaults — like quietly letting a process bind port 80 as a non-root user inside its own namespace. Its daemon keeps state warm across restarts so half-configured things limp along.

Podman does none of that. It is explicit to the point of strict:

- Point a bind mount at a directory that doesn't exist and it won't start — `statfs: no such file or directory`, exit 125 — where Docker would have created the directory and moved on.
- Run an image that binds `:80` as a non-root in-container user and it fails until you grant `net.ipv4.ip_unprivileged_port_start` inside the container yourself. Docker sets that in every container's namespace automatically; Podman makes you ask.
- Map your host user into a container with `keep-id` and it'll change the container's *default* user out from under an entrypoint that assumed root — I had a service die on its own lockfile until I set `User=0` back explicitly.

Every one of those is Docker doing something implicit that Podman insists you say out loud. Moving over, I hit all of them, and the first week was a steady drip of "why won't this start" — each answer a convenience Docker had been extending that I'd never known to thank it for.

On day one that strictness reads as friction. By day thirty it reads as honesty. Nothing on my stack now depends on a daemon's undocumented generosity. What starts, starts for reasons I can name — and a service that comes up is a service I actually configured, not one the daemon guessed into working.

---

### Where Docker still earns it

The case for Docker is real; it's just a different job. Ephemeral, interactive, throwaway work — a one-off Postgres for a test run, hacking on a Dockerfile, a Mac laptop where a daemon-in-a-VM is the smoothest path there is. For that, the daemon's warm state and its willingness to just-create-the-thing are exactly right, and Podman's strictness would be friction with no payoff.

That's simply not what deployment is. Deployment is a fixed set of long-running services on a Linux host you own, that have to survive reboots, restart on failure, log somewhere queryable, and never hand root to an attacker. That reads like systemd's job description, because it is — and Podman is the container runtime that steps out of systemd's way instead of competing with it.

The daemon is Docker's headline feature. For deployment, it was never the feature. It was the thing standing between my containers and the init system that already knew how to run them.
