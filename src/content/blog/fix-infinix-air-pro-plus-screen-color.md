---
title: "Fix Infinix Air Pro+ Screen Color"
description: "Fixing Infinix Air Pro+ washed out screen color in Windows and Linux"
date: 2025-02-21T18:09:54+07:00
draft: false
tags:
  - windows
  - linux
  - hardware
---

The Infinix Air Pro+ has a 2.5K OLED panel — one of the reasons I picked it. It also has a firmware quirk: drop the brightness below ~50%, let the display sleep, and when it wakes up the colors look washed out. Flat blacks, muddy shadows. Crank brightness above 50% and everything snaps back. Drop it again and the blacks stay correct.

The fix: briefly spike the brightness above 50% on every screen wake, then restore the original level. Two scripts, one trigger — covered for both Windows and Linux.

---

### Windows

The Windows approach uses [Event Viewer](https://learn.microsoft.com/en-us/shows/inside/event-viewer) to catch the screen wake event and [NirCmd](https://www.nirsoft.net/utils/nircmd.html) to control brightness.

**Catching the screen wake event**

The right event is _Kernel-Power_, event ID _507_ — fires when the display turns back on.

**The script**

```powershell
# Infinix Air Pro Plus suffers from washed out colors
# after the display goes off and back on if the brightness is below 50%.
# This script will increase the brightness to 60% when initial brightness
# is below 50% else it will increase 10% from current brightness and turn
# back to initial brightness value.

# Path to NirCmd executable
$nircmd = "C:\nircmd-x64\nircmd.exe"

# Function to temporarily adjust brightness
function Adjust-Brightness {
    param (
        [int]$InitialBrightness,
        [int]$TargetBrightness
    )

    # Set brightness to target
    & $nircmd "setbrightness" $TargetBrightness
    Start-Sleep -Seconds 2

    # Restore to initial brightness
    & $nircmd "setbrightness" $InitialBrightness
}

# Dummy current brightness (replace this with actual detection logic if available)
$currentBrightness = (Get-CimInstance -Namespace root/WMI -ClassName WmiMonitorBrightness).CurrentBrightness

if ($currentBrightness -lt 50) {
    # If brightness is below 50%, temporarily set to 60
    Adjust-Brightness -InitialBrightness $currentBrightness -TargetBrightness 60
} else {
    # Otherwise, increase brightness by 10%
    $newBrightness = [Math]::Min($currentBrightness + 10, 100)
    Adjust-Brightness -InitialBrightness $currentBrightness -TargetBrightness $newBrightness
}
```

**Scheduling it**

Use [Task Scheduler](https://www.windowscentral.com/how-create-automated-tasks-windows-11) to run the script whenever the Kernel-Power 507 event fires. You can import [this task](/misc/Restore%20OLED%20Colors.xml) directly — just update the script path and change the author to `YOUR_PC_NAME\YOUR_USERNAME`.

---

### Linux

This guide uses `systemd`. Adjust accordingly if you're on a different init system.

**Catching the screen wake event**

`acpi` and `udev` didn't yield a reliable screen-on event. The approach that works: poll `/sys/class/drm/card1-eDP-1/dpms`, which switches between `On` and `Off` as the display state changes.

**The scripts**

```bash
#!/bin/bash
# monitor /sys/class/drm/card1-eDP-1/dpms value
# place it to /usr/local/bin/monitor_screen_power.sh

prev_state=""

while true; do
    state=$(cat /sys/class/drm/card1-eDP-1/dpms)

    if [[ "$state" != "$prev_state" && "$state" == "On" ]]; then
        echo "Screen turned on! Running script..."
        /usr/local/bin/brightness_fix.sh
    fi

    prev_state=$state
    sleep 1  # Adjust polling interval as needed
done
```

```bash
#!/bin/bash
# adjust the brightness
# place it to /usr/local/bin/brightness_fix.sh

# Path to brightness control (may vary based on hardware, check /sys/class/backlight/)
BRIGHTNESS_PATH="/sys/class/backlight/intel_backlight/brightness"
MAX_BRIGHTNESS_PATH="/sys/class/backlight/intel_backlight/max_brightness"

# Read current brightness
CURRENT_BRIGHTNESS=$(cat "$BRIGHTNESS_PATH")
MAX_BRIGHTNESS=$(cat "$MAX_BRIGHTNESS_PATH")

# Convert brightness levels to percentage
CURRENT_PERCENT=$(( CURRENT_BRIGHTNESS * 100 / MAX_BRIGHTNESS ))

# Function to set brightness based on percentage
set_brightness() {
    local TARGET_PERCENT=$1
    local TARGET_BRIGHTNESS=$(( TARGET_PERCENT * MAX_BRIGHTNESS / 100 ))
    echo $TARGET_BRIGHTNESS | sudo tee "$BRIGHTNESS_PATH" > /dev/null
}

# Adjust brightness logic
if [ "$CURRENT_PERCENT" -lt 50 ]; then
    set_brightness 60
    sleep 0.5
    set_brightness "$CURRENT_PERCENT"
else
    TARGET_PERCENT=$(( CURRENT_PERCENT + 10 ))
    if [ "$TARGET_PERCENT" -gt 100 ]; then
        TARGET_PERCENT=100
    fi
    set_brightness "$TARGET_PERCENT"
    sleep 0.5
    set_brightness "$CURRENT_PERCENT"
fi
```

**Setting up the systemd services**

Create `/etc/systemd/system/brightness-fix.service` to run the monitor script:

```plaintext
[Unit]
Description=Fix screen brightness on wake
After=multi-user.target

[Service]
ExecStart=/usr/local/bin/monitor_screen_power.sh
Restart=always
User=user

[Install]
WantedBy=multi-user.target
```

And `/etc/systemd/system/brightness-fix-wakeup.service` to run the fix after suspend:

```plaintext
[Unit]
Description=Fix screen brightness after wakeup
After=suspend.target

[Service]
Type=oneshot
ExecStart=/usr/local/bin/brightness_fix.sh

[Install]
WantedBy=suspend.target
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable brightness-fix.service
sudo systemctl enable brightness-fix-wakeup.service
sudo systemctl start brightness-fix.service
```

Also add `/usr/local/bin/brightness_fix.sh` to autostart so it runs on login — KDE's Autostart settings handle this.
