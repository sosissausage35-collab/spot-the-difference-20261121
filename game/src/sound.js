// Every sound the game makes, synthesized with WebAudio — no audio files.
// The context is created on the first user gesture, so the game never tries to
// play before the browser allows it.

export function createSound() {
  let context = null;
  let muted = false;

  function ensure() {
    if (context) {
      if (context.state === 'suspended') void context.resume();
      return context;
    }
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      context = new AudioContext();
    } catch {
      context = null;
    }
    return context;
  }

  /** One oscillator note with a quick attack and an exponential fade. */
  function note(frequency, startAt, duration, type, volume) {
    const ctx = ensure();
    if (!ctx || muted) return;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    const t = ctx.currentTime + startAt;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(volume, t + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start(t);
    oscillator.stop(t + duration + 0.05);
  }

  return {
    /** Call from any gesture so the context exists before the first note. */
    unlock() {
      ensure();
    },
    toggleMute() {
      muted = !muted;
      return muted;
    },
    isMuted() {
      return muted;
    },
    click() {
      note(660, 0, 0.08, 'triangle', 0.12);
    },
    /** Two-note chime, rising a fifth: the satisfying mark on each find. */
    find() {
      note(659.25, 0, 0.22, 'sine', 0.22);
      note(987.77, 0.07, 0.32, 'sine', 0.2);
    },
    /** A low dull thud for a wrong click. */
    wrong() {
      note(110, 0, 0.18, 'sine', 0.22);
      note(82.4, 0.02, 0.2, 'triangle', 0.14);
    },
    /** A soft pluck when a hint is spent. */
    hint() {
      note(523.25, 0, 0.18, 'triangle', 0.16);
      note(783.99, 0.06, 0.22, 'triangle', 0.12);
    },
    /** A little pentatonic run for clearing a round. */
    win() {
      const scale = [523.25, 587.33, 659.25, 783.99, 1046.5];
      scale.forEach((frequency, index) => note(frequency, index * 0.09, 0.3, 'sine', 0.2));
    },
    /** One short tick when the clock runs low. */
    tick() {
      note(1200, 0, 0.05, 'square', 0.05);
    },
    /** A warm three-note phrase when a new round begins. */
    roundStart() {
      note(392, 0, 0.2, 'sine', 0.16);
      note(523.25, 0.08, 0.2, 'sine', 0.16);
      note(659.25, 0.16, 0.28, 'sine', 0.16);
    },
  };
}
