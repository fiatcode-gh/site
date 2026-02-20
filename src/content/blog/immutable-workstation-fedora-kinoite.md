---
title: "The Immutable Workstation - Fedora Kinoite"
description: "My journey with atomic desktop from Fedora"
date: 2026-02-20T13:08:00+07:00
draft: false
tags:
  - linux
  - fedora
  - engineering
  - developer_experience
---

There’s a specific kind of anxiety that comes with running a system upgrade on a deadline. You’re not just updating a browser; you’re shifting the ground beneath your IDE, your compilers, and your carefully tuned environment. One bad dependency, and your afternoon is gone.

Lately, I’ve been looking for a way to stop fighting my OS. I wanted a workstation that felt less like a house of cards and more like a solid piece of hardware.

Enter **Fedora Kinoite** (using version 43 as of this post).

### The "Atomic" Difference

Fedora 43 Kinoite isn't your typical Linux distro. It’s an **Atomic Desktop**.

Instead of a traditional package manager that swaps files out one by one, Kinoite uses `rpm-ostree`. Think of it like Git for your operating system. When I update, the system pulls a brand-new, verified image in the background. My current environment stays untouched until I reboot into the new one.

If an update breaks a driver or a core library? I just select the previous deployment at boot, and I’m back to work in seconds. It’s a built-in "undo" button for your entire OS.

---

### Where the "Atomic" Life Shines

If you're a developer, the Atomic workflow solves problems you didn't even realize you had:

- **Disposable Databases:** I need PostgreSQL for my Spring projects, but I hate background services eating 200MB of RAM 24/7. In Kinoite, I run the database in a **Toolbox**. I start it when I code; I kill it when I’m done. My host OS stays "database-free."
- **Version Manager Heaven:** By keeping the system root read-only, you’re forced to manage Node, Java, and Flutter in your Home folder. This creates a clean separation that makes your entire dev-stack portable and incredibly fast.
- **Home-Run IDEs:** I run heavy IDEs (Android Studio, Antigravity, VS Code) as "Home-run" apps. I extract them directly to `~/.local/apps`. They get native performance without "sandboxing" headaches, but they never touch my system root.

---

### Getting Started: Building Your Stack

If you want to try this "Hybrid-Atomic" approach, here is the toolkit I’ve found most effective. Every one of these tools lives in your home directory, keeping your system image pristine.

#### 1. Node.js via [fnm](https://github.com/Schniz/fnm)

Forget NVM; `fnm` is written in Rust and is near-instant.

```bash
curl -fsSL https://fnm.vercel.app/install | bash -s -- --install-dir "./.fnm" --skip-shell

```

#### 2. Java via [SDKMAN!](https://github.com/sdkman/sdkman-cli)

The gold standard for JVM developers. It handles your `JAVA_HOME` symlinks so your IDEs stay synced even when you swap JDK versions.

```bash
curl -s "https://get.sdkman.io" | bash

```

#### 3. Flutter via [Puro](https://github.com/pingbird/puro)

A much faster way to manage Flutter versions and environments than the standard manual install.

```bash
curl -o- https://puro.dev/install.sh | bash

```

#### 4. The "Glue" (Environment Config)

The secret to making this work is using `~/.config/environment.d/60-development.conf`. This tells your "Home-run" IDEs where your tools are before the desktop even loads. No more "JDK not found" errors.

```ini
ANDROID_HOME=/home/user/.local/share/sdks/android
JAVA_HOME=/home/user/.sdkman/candidates/java/current
PURO_ROOT=/home/user/.puro

```

---

### The Verdict

Running Fedora 43 on my IdeaPad 14AHP10 has been a revelation. Because I’ve only "layered" my shell (Fish) onto the host, the system is incredibly lean.

I’ve stopped worrying about my OS. I’m just building things again.

---

### **Final Documentation Summary**

- **OS:** Fedora 43 Kinoite (KDE Plasma 6)
- **Shell:** Fish
- **Hardware:** IdeaPad 14AHP10 (Ryzen 7 8845HS)
- **Method:** Hybrid-Atomic / Home-run management
