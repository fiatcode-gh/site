---
title: "Fix ADB Insufficient Permission"
description: "udev rules for fixing ADB Insufficient permission in Linux"
date: 2025-02-24T11:29:30+07:00
draft: false
tags:
  - linux
  - android
---

## `adb devices` shows `unauthorized`. One udev rule fixes it.

Plug in an Android device on Linux, run `adb devices`, and sometimes you get this:

```bash
$ adb devices

List of devices attached
15241JEC211677  device
RR2M9002AHY     unauthorized
```

The problem is that Linux assigns USB devices to `root` with restrictive permissions (0600) by default. Regular users can't access them directly, so ADB sees the device but can't talk to it.

The fix is a udev rule that assigns the right permissions when the device is plugged in.

---

### Step 1: Find the vendor and product IDs

Run `lsusb` with the device connected:

```bash
$ lsusb

...some other devices
Bus 001 Device 005: ID 18d1:4ee7 Google Inc. Nexus/Pixel Device
```

`18d1` is the _vendor ID_ and `4ee7` is the _product ID_.

---

### Step 2: Create the udev rule

Create a file at `/etc/udev/rules.d/51-android.rules`:

```bash
SUBSYSTEM=="usb", ATTRS{idVendor}=="18d1", ATTRS{idProduct}=="4ee7", MODE="0666", GROUP="plugdev", SYMLINK+="google_pixel_4a_%n"
```

What each field does:

- `SUBSYSTEM=="usb"` — applies only to USB devices
- `ATTRS{idVendor}` and `ATTRS{idProduct}` — matches this specific device
- `MODE="0666"` — read/write access for all users
- `GROUP="plugdev"` — assigns the device to the `plugdev` group
- `SYMLINK+="google_pixel_4a_%n"` — creates a readable symlink under `/dev/` for easier identification

---

### Step 3: Reconnect

Reconnect the device. If it still doesn't work, reload the udev rules and try again:

```bash
$ sudo udevadm control --reload-rules
```
