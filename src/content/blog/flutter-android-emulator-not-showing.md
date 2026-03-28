---
title: "Android Devices Not Showing on Flutter Project"
description: "A fix for new Flutter project that doesn't have Android devices showing up"
date: 2025-02-22T09:21:22+07:00
draft: false
tags:
  - flutter
  - android
---

New Flutter project in Android Studio. Real device plugged in, AVDs configured, everything showing in Device Manager — and the device dropdown in the run toolbar is completely empty.

![no devices showing](/images/no-devices.webp)

Open **File > Project Structure** (`Ctrl + Alt + Shift + S`).

![project structure window](/images/project-structure.webp)

No Android SDK is selected for the project. Pick one from the list and click **OK**.

![choose android sdk](/images/choose-sdk.webp)

That's it. All devices appear immediately — no restart required.
