/**
 * playTick — schedules a short click at `when` (AudioContext time).
 * Accent beat uses 880 Hz; normal beats use 660 Hz.
 */
export function playTick(
  accent: boolean,
  audioCtx: AudioContext,
  when = 0,
): void {
  const t = when || audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.frequency.value = accent ? 880 : 660;
  gain.gain.setValueAtTime(0.3, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.02);
  osc.start(t);
  osc.stop(t + 0.025);
}

export type ActiveChordNodes = {
  oscillators: OscillatorNode[];
  gains: GainNode[];
};

/**
 * playChord — plays a triad with a gentle attack/sustain/release envelope.
 * Returns the active nodes so the caller can stop them early if needed.
 */
export function playChord(
  frequencies: number[],
  audioCtx: AudioContext,
  waveform: OscillatorType = "sine",
): ActiveChordNodes {
  const t = audioCtx.currentTime;
  const oscillators: OscillatorNode[] = [];
  const gains: GainNode[] = [];

  frequencies.forEach((freq) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = waveform;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.exponentialRampToValueAtTime(0.2, t + 0.01);
    gain.gain.setValueAtTime(0.2, t + 1.5);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 1.8);
    osc.start(t);
    osc.stop(t + 1.85);
    oscillators.push(osc);
    gains.push(gain);
  });

  return { oscillators, gains };
}

/**
 * stopChord — immediately fades out and stops a chord started by playChord.
 */
export function stopChord(
  nodes: ActiveChordNodes,
  audioCtx: AudioContext,
): void {
  const t = audioCtx.currentTime;
  nodes.gains.forEach((gain) => {
    try {
      gain.gain.cancelScheduledValues(t);
      gain.gain.setValueAtTime(gain.gain.value, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
    } catch {}
  });
  nodes.oscillators.forEach((osc) => {
    try {
      osc.stop(t + 0.05);
    } catch {}
  });
}
