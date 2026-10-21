/**
 * Modern Javanese Luxury Wedding - Audio Controller
 * Handles background music playback (music.mp3) with a fallback Web Audio API Gamelan Synthesizer.
 */

class WeddingAudioManager {
  constructor() {
    this.audioElement = new Audio();
    this.audioElement.src = 'assets/audio/alunan.mp4';
    this.audioElement.loop = true;
    this.audioElement.preload = 'auto';

    this.isPlaying = false;
    this.useSynthFallback = false;
    this.audioCtx = null;
    this.synthInterval = null;
    
    this.musicButton = null;
    this.musicIcon = null;
    this.visualizerBars = null;

    this.init();
  }

  init() {
    let triedRoot = false;
    this.audioElement.addEventListener('error', () => {
      if (!triedRoot) {
        triedRoot = true;
        this.audioElement.src = 'alunan.mp4';
        this.audioElement.load();
        return;
      }
      console.log('alunan.mp4 not found or failed to load. Enabling interactive Gamelan Ambient Synthesizer.');
      this.useSynthFallback = true;
    });

    this.audioElement.addEventListener('play', () => {
      this.isPlaying = true;
      this.updateUI();
    });

    this.audioElement.addEventListener('pause', () => {
      this.isPlaying = false;
      this.updateUI();
    });
  }

  setUIElements(button, icon, visualizer) {
    this.musicButton = button;
    this.musicIcon = icon;
    this.visualizerBars = visualizer;

    if (this.musicButton) {
      this.musicButton.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggle();
      });
    }
  }

  async play() {
    if (this.useSynthFallback) {
      this.startSynthGamelan();
      this.isPlaying = true;
      this.updateUI();
      return;
    }

    try {
      const playPromise = this.audioElement.play();
      if (playPromise !== undefined) {
        await playPromise;
        this.isPlaying = true;
        this.updateUI();
      }
    } catch (err) {
      console.warn('Audio autoplay prevented or error. Falling back to ambient synth on interaction.', err);
      // Fallback
      this.startSynthGamelan();
      this.isPlaying = true;
      this.updateUI();
    }
  }

  pause() {
    if (this.useSynthFallback || this.synthInterval) {
      this.stopSynthGamelan();
      this.isPlaying = false;
      this.updateUI();
    }
    this.audioElement.pause();
    this.isPlaying = false;
    this.updateUI();
  }

  toggle() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  updateUI() {
    if (!this.musicButton) return;

    if (this.isPlaying) {
      this.musicButton.classList.add('is-playing');
      this.musicButton.setAttribute('aria-label', 'Jeda Musik');
      if (this.musicIcon) {
        this.musicIcon.innerHTML = `
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <rect x="6" y="4" width="4" height="16" rx="1"></rect>
            <rect x="14" y="4" width="4" height="16" rx="1"></rect>
          </svg>`;
      }
    } else {
      this.musicButton.classList.remove('is-playing');
      this.musicButton.setAttribute('aria-label', 'Putar Musik');
      if (this.musicIcon) {
        this.musicIcon.innerHTML = `
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <polygon points="6,4 20,12 6,20"></polygon>
          </svg>`;
      }
    }
  }

  /* Gamelan Pelog / Slendro Ambient Synthesizer (Fallback when music.mp3 is not loaded) */
  startSynthGamelan() {
    try {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtxClass) return;
      if (!this.audioCtx) {
        this.audioCtx = new AudioCtxClass();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      if (this.synthInterval) return;

      // Javanese Pelog scale frequencies (Hz) - gender/bonang soothing resonance
      // 1 (Panunggul): 290Hz, 2 (Gulu): 320Hz, 3 (Dhadha): 360Hz, 5 (Lima): 435Hz, 6 (Nem): 480Hz, 7 (Pelog): 540Hz
      const pelogFrequencies = [
        290.0, 320.0, 360.0, 435.0, 480.0, 540.0, 580.0, 640.0, 720.0
      ];

      // Play soft ambient gong base
      this.playGongTone(145.0);

      let step = 0;
      const melodyPattern = [0, 2, 4, 3, 5, 2, 4, 1, 3, 5, 4, 2, 0, 3, 1, 0];

      this.synthInterval = setInterval(() => {
        if (!this.isPlaying) return;
        const noteIdx = melodyPattern[step % melodyPattern.length];
        const freq = pelogFrequencies[noteIdx % pelogFrequencies.length];
        
        this.playBonangNote(freq, 1.8);

        // Soft counter-melody every 2 steps
        if (step % 2 === 0) {
          const counterNote = pelogFrequencies[(noteIdx + 3) % pelogFrequencies.length];
          setTimeout(() => {
            if (this.isPlaying) this.playBonangNote(counterNote * 0.5, 2.4, 0.08);
          }, 350);
        }

        // Deep Gong sound every 16 steps
        if (step % 16 === 0) {
          this.playGongTone(145.0);
        }

        step++;
      }, 700);

    } catch (e) {
      console.warn('Synth gamelan playback error:', e);
    }
  }

  playBonangNote(freq, decayTime = 1.5, volume = 0.12) {
    if (!this.audioCtx) return;
    const now = this.audioCtx.currentTime;

    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    // Harmonics for rich bronze bell / gamelan kettle timbre
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    // Envelope
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + decayTime);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start(now);
    osc.stop(now + decayTime);
  }

  playGongTone(freq = 145.0) {
    if (!this.audioCtx) return;
    const now = this.audioCtx.currentTime;

    const osc = this.audioCtx.createOscillator();
    const subOsc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(freq * 0.5, now);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 4.5);

    osc.connect(gain);
    subOsc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start(now);
    subOsc.start(now);
    osc.stop(now + 4.5);
    subOsc.stop(now + 4.5);
  }

  stopSynthGamelan() {
    if (this.synthInterval) {
      clearInterval(this.synthInterval);
      this.synthInterval = null;
    }
  }
}

window.WeddingAudio = new WeddingAudioManager();

