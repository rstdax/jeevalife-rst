// ================= AUDIO SYNTHESIZER (WEB AUDIO API) =================

let audioCtx: AudioContext | null = null;

export function initAudio(): void {
  if (!audioCtx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AC();
  }
  // Android Chrome often starts AudioContext in 'suspended' state
  // Resume it on user interaction
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

function playTone(freq: number, type: OscillatorType, duration: number, volLevel: number = 0.1): void {
  if (!audioCtx) initAudio();
  if (!audioCtx) return;

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

  gain.gain.setValueAtTime(volLevel, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

export const sounds = {
  click: () => playTone(600, 'sine', 0.1, 0.1),
  waterDrop: () => {
    playTone(800, 'sine', 0.1, 0.1);
    setTimeout(() => playTone(1200, 'sine', 0.15, 0.05), 50);
  },
  swoosh: () => playTone(300, 'triangle', 0.2, 0.05),
  success: () => {
    playTone(523.25, 'sine', 0.1, 0.1);
    setTimeout(() => playTone(659.25, 'sine', 0.1, 0.1), 100);
    setTimeout(() => playTone(783.99, 'sine', 0.3, 0.1), 200);
  },
};

// ================= CONTINUOUS THERAPY AUDIO =================
let therapyOsc: OscillatorNode | null = null;
let therapyGain: GainNode | null = null;
let isTherapyPlaying = false;

export function toggleTherapy(sfxEnabled: boolean): boolean {
  if (!sfxEnabled) return false;
  if (!audioCtx) initAudio();
  if (!audioCtx) return false;

  if (!isTherapyPlaying) {
    therapyOsc = audioCtx.createOscillator();
    therapyGain = audioCtx.createGain();

    therapyOsc.type = 'sine';
    therapyOsc.frequency.value = 432;

    // LFO for slow volume modulation (breathing/wave effect)
    const lfo = audioCtx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.1;
    const lfoGain = audioCtx.createGain();
    lfoGain.gain.value = 0.02;
    lfo.connect(lfoGain);
    lfoGain.connect(therapyGain.gain);
    lfo.start();

    therapyGain.gain.setValueAtTime(0.01, audioCtx.currentTime);
    therapyGain.gain.linearRampToValueAtTime(0.05, audioCtx.currentTime + 2);

    therapyOsc.connect(therapyGain);
    therapyGain.connect(audioCtx.destination);

    therapyOsc.start();
    isTherapyPlaying = true;
    return true;
  } else {
    if (therapyGain && therapyOsc) {
      therapyGain.gain.linearRampToValueAtTime(0.001, audioCtx.currentTime + 1);
      const oscRef = therapyOsc;
      setTimeout(() => {
        oscRef.stop();
        oscRef.disconnect();
      }, 1000);
    }
    isTherapyPlaying = false;
    return false;
  }
}
