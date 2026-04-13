let audioContext = null;
let masterGain = null;
let musicNodes = [];
let musicStarted = false;

function ensureAudio() {
  if (typeof window === "undefined") return null;
  const AudioContextRef = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextRef) return null;
  if (!audioContext) {
    audioContext = new AudioContextRef();
    masterGain = audioContext.createGain();
    masterGain.gain.value = 0.06;
    masterGain.connect(audioContext.destination);
  }
  if (audioContext.state === "suspended") {
    audioContext.resume().catch(() => {});
  }
  return audioContext;
}

function playTone({ frequency = 220, type = "sine", duration = 0.16, gain = 0.16, when = 0 } = {}) {
  const ctx = ensureAudio();
  if (!ctx || !masterGain) return;
  const osc = ctx.createOscillator();
  const env = ctx.createGain();
  const startAt = ctx.currentTime + when;
  const endAt = startAt + duration;

  osc.type = type;
  osc.frequency.setValueAtTime(frequency, startAt);
  env.gain.setValueAtTime(0.0001, startAt);
  env.gain.linearRampToValueAtTime(gain, startAt + 0.02);
  env.gain.exponentialRampToValueAtTime(0.0001, endAt);

  osc.connect(env);
  env.connect(masterGain);
  osc.start(startAt);
  osc.stop(endAt + 0.02);
}

export function playStepFx() {
  playTone({ frequency: 180, type: "triangle", duration: 0.05, gain: 0.04 });
}

export function playEncounterFx() {
  playTone({ frequency: 320, type: "square", duration: 0.08, gain: 0.08 });
  playTone({ frequency: 420, type: "triangle", duration: 0.12, gain: 0.06, when: 0.05 });
}

export function playShinyFx() {
  playTone({ frequency: 620, type: "triangle", duration: 0.12, gain: 0.08 });
  playTone({ frequency: 840, type: "sine", duration: 0.16, gain: 0.07, when: 0.08 });
  playTone({ frequency: 1180, type: "sine", duration: 0.22, gain: 0.06, when: 0.16 });
}

export function playCaptureFx(success = true) {
  if (success) {
    playTone({ frequency: 280, type: "triangle", duration: 0.08, gain: 0.06 });
    playTone({ frequency: 420, type: "triangle", duration: 0.1, gain: 0.07, when: 0.08 });
    playTone({ frequency: 620, type: "sine", duration: 0.14, gain: 0.08, when: 0.18 });
    return;
  }
  playTone({ frequency: 220, type: "square", duration: 0.09, gain: 0.05 });
  playTone({ frequency: 170, type: "square", duration: 0.12, gain: 0.05, when: 0.08 });
}

export function startMapMusic() {
  const ctx = ensureAudio();
  if (!ctx || !masterGain || musicStarted) return;
  musicStarted = true;

  const pad = ctx.createOscillator();
  const pulse = ctx.createOscillator();
  const padGain = ctx.createGain();
  const pulseGain = ctx.createGain();

  pad.type = "sine";
  pulse.type = "triangle";
  pad.frequency.setValueAtTime(146.83, ctx.currentTime);
  pulse.frequency.setValueAtTime(220, ctx.currentTime);
  padGain.gain.value = 0.012;
  pulseGain.gain.value = 0.006;

  pulseGain.gain.setValueAtTime(0.003, ctx.currentTime);
  pulseGain.gain.linearRampToValueAtTime(0.007, ctx.currentTime + 2.4);
  pulseGain.gain.linearRampToValueAtTime(0.003, ctx.currentTime + 4.8);

  pad.connect(padGain);
  pulse.connect(pulseGain);
  padGain.connect(masterGain);
  pulseGain.connect(masterGain);

  pad.start();
  pulse.start();
  musicNodes = [pad, pulse, padGain, pulseGain];
}

export function stopMapMusic() {
  if (!musicNodes.length) return;
  for (const node of musicNodes) {
    if (typeof node.stop === "function") {
      try { node.stop(); } catch {}
    }
    if (typeof node.disconnect === "function") {
      try { node.disconnect(); } catch {}
    }
  }
  musicNodes = [];
  musicStarted = false;
}
