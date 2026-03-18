---
title: "Building My Own Self-Hosted Music Library"
description: "From format wars to streaming anywhere, on my own terms"
date: 2026-03-18T16:18:00+07:00
draft: false
tags:
  - linux
  - self-hosting
  - music
  - open-source
---

There's a specific kind of dissatisfaction that comes with streaming services. The music is there, the app is polished, but none of it is really _yours_. The moment you stop paying, it disappears. The algorithm decides what comes next. Your listening history is someone else's data.

I had a collection of digital audio files sitting around and I wanted to stream them to my phone from anywhere. Not through Spotify. Not through YouTube Music. Just my files, my server, my player.

So I built the whole pipeline from scratch — format conversion, cover art, playlists, and a self-hosted music server. This post covers all of it.

---

### Why Opus?

Before writing a single line of code, I had to settle the format question.

The short answer: **FLAC** for archival, **Opus** for everyday listening.

FLAC is lossless and open source — the master copy that doesn't throw away any information. Opus is a modern lossy codec that beats MP3 and AAC at equivalent bitrates. At 160kbps, Opus is considered perceptually transparent — meaning in blind listening tests, people can't reliably tell it apart from lossless. I verified this myself using [Spek](https://spek.cc/) to compare spectrograms side-by-side.

The high-frequency rolloff above ~20kHz is visible on the spectrogram, but it's inaudible. No amount of bitrate will make a lossy file match a lossless one on a graph — that's the nature of lossy compression. The point is that 160k Opus sounds identical in practice, and the files are a fraction of the size.

---

### Opus vs OGG — A Quick Detour

These two are often confused, and I ran into this confusion head-first while writing the conversion scripts.

**Opus** is the audio _codec_ — the algorithm that compresses the audio data. **OGG** is a _container format_ — the file wrapper that holds the audio, metadata, and optionally cover art.

The `.opus` extension uses a strict Opus container that only supports audio streams. No embedded images. The `.ogg` extension is more flexible and can carry Opus audio alongside cover art — but FFmpeg's OGG muxer doesn't actually support writing embedded images either. After a lot of trial and error, I gave up on embedded art entirely and went with the standard approach:

- `.opus` files for audio
- `cover.jpg` in each album or single directory

This is actually cleaner anyway. Navidrome picks up folder-level cover art natively, and it works everywhere without container compatibility headaches.

---

### Directory Structure

Each release gets its own directory, whether it's an album, an EP, or a single:

```
Music/
  Artist Name/
    Album Name/
      01 - Track Title.opus
      02 - Track Title.opus
      cover.jpg
      Album Name.m3u
```

Singles follow the same pattern — their own folder, their own `cover.jpg`. No flat dumps. No shared cover art across multiple releases.

---

### The Conversion Pipeline

I wrote two scripts: a Python script that handles the actual conversion and cover art extraction, and a Fish shell function that wraps it for batch use.

#### `flac2opus.py`

The Python script does three things: converts FLAC to Opus using FFmpeg, extracts the embedded cover art from the FLAC file, and saves it as `cover.jpg` in the output directory. It skips cover extraction if a `cover.jpg` already exists, so running it twice on the same directory is safe.

```python
#!/usr/bin/env python3
"""Convert FLAC to Opus with folder-based cover art."""

import sys
import subprocess
from pathlib import Path


def convert(input_path: Path, output_path: Path, bitrate: str = "160k"):
    from mutagen.flac import FLAC

    flac = FLAC(input_path)
    pictures = flac.pictures

    subprocess.run([
        "ffmpeg", "-i", str(input_path),
        "-map", "0:a",
        "-c:a", "libopus",
        "-b:a", bitrate,
        "-y", str(output_path)
    ], check=True)

    if pictures:
        import io
        from PIL import Image

        cover_path = output_path.parent / "cover.jpg"
        if not cover_path.exists():
            img = Image.open(io.BytesIO(pictures[0].data)).convert("RGB")
            w, h = img.size
            if w > h:
                left = (w - h) // 2
                img = img.crop((left, 0, left + h, h))
            img.save(cover_path, format="JPEG", quality=90)
            print(f"  Cover art saved ({img.width}x{img.height})")
        else:
            print(f"  cover.jpg already exists, skipping")
    else:
        print(f"  No cover art found")


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: flac2opus.py <input.flac> <output.opus> [bitrate]")
        sys.exit(1)

    input_path = Path(sys.argv[1])
    output_path = Path(sys.argv[2])
    bitrate = sys.argv[3] if len(sys.argv) > 3 else "160k"

    convert(input_path, output_path, bitrate)
```

The center-crop on wide images handles YouTube Music thumbnails — they come in as landscape JPEGs, so the script crops them to a square before saving.

Full source: [`scripts/flac2opus.py`](https://codeberg.org/fiatcode/fish/src/branch/main/scripts/flac2opus.py)

#### `flac2opus` Fish function

The Fish function wraps the Python script and adds batch processing, skip detection, and M3U playlist handling per directory. It uses [`uv run --with`](https://docs.astral.sh/uv/guides/scripts/#running-a-script-with-dependencies) to pull in `mutagen` and `pillow` inline — no virtualenv, no manual dependency installation needed. `uv` handles it on the first run and caches it after that.

```fish
function flac2opus --description "Batch convert FLAC to Opus"
    set bitrate "160k"
    set dir "."
    set script ~/.config/fish/scripts/flac2opus.py

    for arg in $argv
        switch $arg
            case '-b' '--bitrate'
                set bitrate $argv[(math (contains -i -- $arg $argv) + 1)]
            case '*.flac'
                set out (string replace -r '\.flac$' '.opus' $arg)
                if uv run --with mutagen --with pillow $script $arg $out $bitrate
                    _flac2opus_handle_m3u (dirname $arg)
                end
                return
            case '*'
                set dir $arg
        end
    end

    set files (find $dir -name "*.flac")
    set total (count $files)
    set current 0
    set converted_dirs

    for file in $files
        set current (math $current + 1)
        set out (string replace -r '\.flac$' '.opus' $file)

        if test -f $out
            echo "[$current/$total] Skipping (already exists): $file"
            continue
        end

        echo "[$current/$total] Converting: $file"
        if uv run --with mutagen --with pillow $script $file $out $bitrate
            set file_dir (dirname $file)
            if not contains $file_dir $converted_dirs
                set -a converted_dirs $file_dir
            end
        end
    end

    for d in $converted_dirs
        _flac2opus_handle_m3u $d
    end

    echo "Done."
end

function _flac2opus_handle_m3u --description "Create or update M3U playlist in a directory"
    set d $argv[1]
    set dirname (basename $d)
    set existing_m3u (find $d -maxdepth 1 -name "*.m3u" 2>/dev/null | head -1)

    if test -n "$existing_m3u"
        set new_m3u "$d/$dirname.m3u"
        if test "$existing_m3u" != "$new_m3u"
            mv $existing_m3u $new_m3u
            echo "  Renamed M3U: "(basename $existing_m3u)" → $dirname.m3u"
        end
        sed -i 's/\.flac/.opus/g' $new_m3u
        echo "  Updated M3U: $dirname.m3u"
    else
        set opus_files (find $d -maxdepth 1 -name "*.opus" | sort)
        if test (count $opus_files) -gt 0
            set m3u_path "$d/$dirname.m3u"
            echo "#EXTM3U" > $m3u_path
            for f in $opus_files
                echo (basename $f) >> $m3u_path
            end
            echo "  Created M3U: $dirname.m3u"
        end
    end
end
```

Full source: [`functions/flac2opus.fish`](https://codeberg.org/fiatcode/fish/src/branch/main/functions/flac2opus.fish)

The M3U logic handles two cases: if a playlist already exists (possibly with a mismatched name or `.flac` references), it renames it to match the directory name and rewrites the extensions. If none exists, it creates one from the converted files.

#### Usage

```fish
flac2opus                    # convert all FLAC in current directory
flac2opus ~/Music            # specific directory
flac2opus song.flac          # single file
flac2opus ~/Music -b 192k    # custom bitrate
```

After converting, remove the original FLAC files:

```fish
find . -name "*.flac" -print -delete
```

---

### Downloading from YouTube Music

I also wrote `ytm2opus` — a Fish function that downloads from YouTube Music and converts to Opus in one step, using `yt-dlp` under the hood.

It downloads at the highest available source quality (up to 262kbps Opus with premium), converts via `flac2opus.py` (same script, same `uv` inline dependencies), creates a named output directory automatically, saves `cover.jpg`, and generates an M3U playlist. The source is always FLAC — download first at best quality, then re-encode. Never transcode from an already-lossy source.

It uses the `bgutil-ytdlp-pot-provider` plugin for YouTube Music premium quality, and requires a cookies file exported from your browser. Setup instructions are in the script header.

Full source: [`functions/ytm2opus.fish`](https://codeberg.org/fiatcode/fish/src/branch/main/functions/ytm2opus.fish)

```fish
ytm2opus 'https://music.youtube.com/watch?v=...'        # single track
ytm2opus 'https://music.youtube.com/playlist?list=...'  # album or playlist
ytm2opus -g 'Reggae' 'https://...'                      # with genre tag
```

---

### Self-Hosting with Navidrome

[Navidrome](https://www.navidrome.org/) is a lightweight, open source music server that implements the Subsonic API. It runs comfortably on a modest VPS, has a clean web UI, and the Subsonic API means a wide choice of Android clients. I use [Musly](https://musly.devid.ink/) on Android.

I run it on my Netcup VPS behind Traefik v3:

```yaml
services:
  navidrome:
    image: deluan/navidrome:latest
    restart: unless-stopped
    volumes:
      - ./data:/data
      - ./music:/music:ro
    environment:
      ND_MUSICFOLDER: /music
      ND_DATAFOLDER: /data
      ND_LOGLEVEL: info
      ND_SCANSCHEDULE: 1h
      ND_SESSIONTIMEOUT: 24h
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.navidrome.rule=Host(`music.dhemasnurjaya.com`)"
      - "traefik.http.routers.navidrome.entrypoints=websecure"
      - "traefik.http.routers.navidrome.tls.certresolver=letsencrypt"
      - "traefik.http.services.navidrome.loadbalancer.server.port=4533"
    networks:
      - traefik-proxy

networks:
  traefik-proxy:
    external: true
```

Upload your music with rsync:

```bash
rsync -avz --progress ~/Music/ user@your-vps:/path/to/navidrome/music/
```

On first run Navidrome will prompt you to create an admin account, then scan the music folder automatically.

---

### The Full Pipeline

Put it all together and it looks like this:

1. Rip or download FLAC (lossless master)
2. Run `flac2opus` — converts to Opus 160k, extracts `cover.jpg`, generates M3U
3. Delete original FLAC files
4. `rsync` to VPS
5. Navidrome picks it up on the next scan

It's not the simplest setup. But it's fully open source, self-hosted, and mine. No subscriptions, no tracking, no algorithm deciding what comes next.

That's the whole point.
