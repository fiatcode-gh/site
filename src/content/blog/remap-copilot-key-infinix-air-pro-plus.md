---
title: "Remap Infinix Air Pro+ Copilot Key in Linux"
description: "Re-using Copilot key for something else more useful"
date: 2025-03-01T22:41:32+07:00
draft: false
tags:
  - linux
  - hardware
  - tweak
---

Honestly, even on Windows I never once pressed that Copilot key intentionally. It just sat there, taking up prime keyboard real estate. Moving to Linux gave me the perfect excuse to finally do something about it.

---

### What you'll need

- A laptop with a Copilot key (I'm on the Infinix Air Pro+)
- [keyd](https://github.com/rvaiya/keyd) installed

---

### Finding out what the key actually sends

Start by running `sudo keyd monitor` in your terminal. It will print keyboard events as you press keys. Hit the Copilot key and watch the output.

On my machine, it printed:

```bash
AT Translated Set 2 keyboard  0001:0001:70533846  leftmeta down
AT Translated Set 2 keyboard  0001:0001:70533846  leftshift down
AT Translated Set 2 keyboard  0001:0001:70533846  f23 down
```

So the key fires `leftmeta + leftshift + f23` — a modifier combo plus a function key. The problem is KDE's shortcut dialog only picks up `meta + shift`, completely ignoring `f23`. Binding it there is a dead end.

---

### Remapping with keyd

Edit `/etc/keyd/default.conf` and add:

```ini
[ids]
0001:0001:70533846

[main]
f23 = f13
```

The `ids` section targets this specific keyboard. The last line remaps `f23` to `f13` — a key that doesn't physically exist, which means KDE sees a clean, unambiguous keypress with no conflicting modifiers.

Reload keyd with `sudo keyd reload`, then head to KDE's shortcut settings and bind the Copilot key to whatever you want. I mapped mine to [Yakuake](https://github.com/KDE/yakuake)'s show/hide toggle.

A dedicated dropdown terminal, one keypress away — much better than launching Copilot.
