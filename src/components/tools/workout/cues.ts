import type { CueName } from "@/lib/tools/workout/session/session";

interface Tone {
  hz: number;
  at: number;
  ms: number;
}

interface Cues {
  unlock(): void;
  play(name: CueName): void;
}

const GAIN = 0.2;
const RAMP_S = 0.01;

const TONES: Readonly<Record<CueName, readonly Tone[]>> = {
  "set-start": [{ hz: 660, at: 0, ms: 120 }],
  "rest-end": [
    { hz: 880, at: 0, ms: 120 },
    { hz: 880, at: 200, ms: 120 },
  ],
  "hold-target": [{ hz: 990, at: 0, ms: 200 }],
  "session-end": [
    { hz: 660, at: 0, ms: 120 },
    { hz: 880, at: 120, ms: 120 },
    { hz: 1100, at: 240, ms: 120 },
  ],
};

type AudioWindow = Window & { webkitAudioContext?: typeof AudioContext };

export function createCues({ isMuted }: { isMuted: () => boolean }): Cues {
  let context: AudioContext | null = null;

  function unlock(): void {
    try {
      if (!context) {
        const AudioContextClass =
          window.AudioContext ?? (window as AudioWindow).webkitAudioContext;
        if (!AudioContextClass) return;
        context = new AudioContextClass();
      }
      if (context.state === "suspended") context.resume().catch(() => {});
    } catch {
      context = null;
    }
  }

  function tone(audio: AudioContext, { hz, at, ms }: Tone): void {
    const start = audio.currentTime + at / 1000;
    const end = start + ms / 1000;
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = hz;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(GAIN, start + RAMP_S);
    gain.gain.setValueAtTime(GAIN, end - RAMP_S);
    gain.gain.linearRampToValueAtTime(0, end);
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start(start);
    oscillator.stop(end);
  }

  function play(name: CueName): void {
    const tones = TONES[name];
    const audio = context;
    if (!tones || isMuted() || !audio || audio.state !== "running") return;
    try {
      for (const t of tones) tone(audio, t);
    } catch {
      // A cue is optional: every one has an on-screen twin.
    }
  }

  return { unlock, play };
}
