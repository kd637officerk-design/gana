import { SynthProfile, Track } from '../types/music';

const EQ_BAND_FREQS = [60, 230, 910, 3600, 14000];

// Tiny 1-second silent PCM WAV to anchor Android & Windows OS Media Notifications during synth playback
const SILENT_WAV_DATA_URI =
  'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';

class CaveAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private eqFilters: BiquadFilterNode[] = [];
  private dryGain: GainNode | null = null;
  private wetGain: GainNode | null = null;
  private convolver: ConvolverNode | null = null;
  private analyser: AnalyserNode | null = null;

  private htmlAudio: HTMLAudioElement | null = null;
  private mediaSource: MediaElementAudioSourceNode | null = null;
  private mediaSessionAudio: HTMLAudioElement | null = null;

  private activeTrack: Track | null = null;
  private isPlaying = false;
  private currentTime = 0;
  private volume = 0.78;
  private caveReverb = false;
  private eqBands: [number, number, number, number, number] = [0, 0, 0, 0, 0];

  private synthTimer: number | null = null;
  private progressTimer: number | null = null;
  private synthStep = 0;
  private noiseNode: AudioBufferSourceNode | null = null;
  private noiseGain: GainNode | null = null;
  private lastTickPerf = 0;

  private onTimeUpdateCb: ((time: number) => void) | null = null;
  private onEndedCb: (() => void) | null = null;

  public setCallbacks(onTimeUpdate: (time: number) => void, onEnded: () => void) {
    this.onTimeUpdateCb = onTimeUpdate;
    this.onEndedCb = onEnded;
  }

  private startMediaSessionAnchor() {
    if (!this.mediaSessionAudio) {
      this.mediaSessionAudio = new Audio(SILENT_WAV_DATA_URI);
      this.mediaSessionAudio.loop = true;
      this.mediaSessionAudio.volume = 0.01;
    }
    void this.mediaSessionAudio.play().catch(() => {});
  }

  private pauseMediaSessionAnchor() {
    if (this.mediaSessionAudio) {
      this.mediaSessionAudio.pause();
    }
  }

  private ensureContext() {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.volume;

      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 64;
      this.analyser.smoothingTimeConstant = 0.82;

      this.eqFilters = EQ_BAND_FREQS.map((freq, idx) => {
        const filter = this.ctx!.createBiquadFilter();
        filter.type =
          idx === 0 ? 'lowshelf' : idx === EQ_BAND_FREQS.length - 1 ? 'highshelf' : 'peaking';
        filter.frequency.value = freq;
        filter.Q.value = 1.1;
        filter.gain.value = this.eqBands[idx];
        return filter;
      });

      for (let i = 0; i < this.eqFilters.length - 1; i++) {
        this.eqFilters[i].connect(this.eqFilters[i + 1]);
      }

      this.dryGain = this.ctx.createGain();
      this.dryGain.gain.value = this.caveReverb ? 0.72 : 1.0;

      this.wetGain = this.ctx.createGain();
      this.wetGain.gain.value = this.caveReverb ? 0.42 : 0.0;

      this.convolver = this.ctx.createConvolver();
      this.convolver.buffer = this.createCaveImpulse(2.6, 3.0);

      const lastEq = this.eqFilters[this.eqFilters.length - 1];
      lastEq.connect(this.dryGain);
      lastEq.connect(this.convolver);
      this.convolver.connect(this.wetGain);

      this.dryGain.connect(this.masterGain);
      this.wetGain.connect(this.masterGain);

      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
  }

  private createCaveImpulse(duration: number, decay: number): AudioBuffer {
    const ctx = this.ctx!;
    const rate = ctx.sampleRate;
    const length = Math.floor(rate * duration);
    const impulse = ctx.createBuffer(2, length, rate);
    for (let ch = 0; ch < 2; ch++) {
      const data = impulse.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        const env = Math.pow(1 - i / length, decay);
        data[i] = (Math.random() * 2 - 1) * env * 0.55;
      }
    }
    return impulse;
  }

  public async playTrack(track: Track, startSeconds = 0) {
    this.ensureContext();
    this.stopCurrentSource();

    this.activeTrack = track;
    this.currentTime = startSeconds;
    this.isPlaying = true;

    if (track.sourceType === 'local' && track.audioUrl) {
      this.pauseMediaSessionAnchor();
      await this.startLocalAudio(track.audioUrl, startSeconds);
    } else {
      this.startMediaSessionAnchor();
      this.startSynthAudio(track, startSeconds);
    }
  }

  private async startLocalAudio(url: string, startSeconds: number) {
    if (!this.htmlAudio) {
      this.htmlAudio = new Audio();
      this.htmlAudio.crossOrigin = 'anonymous';
      this.htmlAudio.addEventListener('timeupdate', () => {
        if (this.htmlAudio && this.activeTrack?.sourceType === 'local') {
          this.currentTime = this.htmlAudio.currentTime;
          this.onTimeUpdateCb?.(this.currentTime);
        }
      });
      this.htmlAudio.addEventListener('ended', () => {
        if (this.activeTrack?.sourceType === 'local') {
          this.isPlaying = false;
          this.onEndedCb?.();
        }
      });
    }

    if (!this.mediaSource && this.ctx) {
      this.mediaSource = this.ctx.createMediaElementSource(this.htmlAudio);
      this.mediaSource.connect(this.eqFilters[0]);
    }

    if (this.htmlAudio.src !== url) {
      this.htmlAudio.src = url;
    }
    this.htmlAudio.currentTime = startSeconds;
    try {
      await this.htmlAudio.play();
    } catch {
      // ignore autoplay blocks before user gesture
    }
  }

  private startSynthAudio(track: Track, startSeconds: number) {
    const profile: SynthProfile = track.synthProfile ?? {
      rootFreq: 130.81,
      bpm: 66,
      scaleIntervals: [0, 3, 7, 10, 14],
      padWarmth: 600,
      rainLevel: 0.035,
    };

    this.startRainTexture(profile.rainLevel);

    const stepMs = Math.round((60 / profile.bpm) * 1000);
    this.synthStep = Math.floor(startSeconds / (stepMs / 1000));

    this.triggerSynthStep(profile);

    this.synthTimer = window.setInterval(() => {
      if (!this.isPlaying) return;
      this.synthStep += 1;
      this.triggerSynthStep(profile);
    }, stepMs);

    this.lastTickPerf = performance.now();
    this.progressTimer = window.setInterval(() => {
      if (!this.isPlaying || !this.activeTrack) return;
      const now = performance.now();
      const delta = (now - this.lastTickPerf) / 1000;
      this.lastTickPerf = now;
      this.currentTime += delta;

      if (this.currentTime >= this.activeTrack.duration) {
        this.currentTime = this.activeTrack.duration;
        this.onTimeUpdateCb?.(this.currentTime);
        this.stopCurrentSource();
        this.isPlaying = false;
        this.onEndedCb?.();
        return;
      }
      this.onTimeUpdateCb?.(this.currentTime);
    }, 200);
  }

  private startRainTexture(level: number) {
    if (!this.ctx || level <= 0) return;
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0;
    let b1 = 0;
    let b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99765 * b0 + white * 0.099046;
      b1 = 0.963 * b1 + white * 0.2965164;
      b2 = 0.57 * b2 + white * 1.0526913;
      data[i] = (b0 + b1 + b2 + white * 0.1848) * 0.08;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1100;

    const gain = this.ctx.createGain();
    gain.gain.value = level;

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.eqFilters[0]);
    noise.start();

    this.noiseNode = noise;
    this.noiseGain = gain;
  }

  private triggerSynthStep(profile: SynthProfile) {
    if (!this.ctx || !this.eqFilters.length) return;
    const now = this.ctx.currentTime;
    const step = this.synthStep;

    if (step % 4 === 0) {
      const chordRootShift = [0, -2, 3, -5][Math.floor(step / 4) % 4];
      const baseFreq = profile.rootFreq * Math.pow(2, chordRootShift / 12);

      this.playTone(baseFreq * 0.5, 'sine', now, 3.6, 0.18, 280);

      const chordTones = [
        0,
        profile.scaleIntervals[1],
        profile.scaleIntervals[2],
        profile.scaleIntervals[3],
      ];
      chordTones.forEach((semi, idx) => {
        const freq = baseFreq * Math.pow(2, semi / 12);
        this.playTone(
          freq,
          idx === 0 ? 'triangle' : 'sine',
          now + idx * 0.04,
          3.4,
          0.075,
          profile.padWarmth
        );
      });
    }

    if (step % 2 === 0 || step % 3 === 0) {
      const interval = profile.scaleIntervals[step % profile.scaleIntervals.length];
      const octaveBoost = step % 5 === 0 ? 2 : 1;
      const melodyFreq = profile.rootFreq * 2 * octaveBoost * Math.pow(2, interval / 12);
      this.playTone(melodyFreq, 'triangle', now + 0.02, 1.35, 0.055, profile.padWarmth * 1.8);
    }
  }

  private playTone(
    freq: number,
    type: OscillatorType,
    startTime: number,
    duration: number,
    peakGain: number,
    cutoff: number
  ) {
    if (!this.ctx || !this.eqFilters.length) return;

    const osc = this.ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(cutoff, startTime);

    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0.0001, startTime);
    env.gain.exponentialRampToValueAtTime(peakGain, startTime + 0.08);
    env.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(filter);
    filter.connect(env);
    env.connect(this.eqFilters[0]);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);
  }

  private stopCurrentSource() {
    if (this.synthTimer !== null) {
      clearInterval(this.synthTimer);
      this.synthTimer = null;
    }
    if (this.progressTimer !== null) {
      clearInterval(this.progressTimer);
      this.progressTimer = null;
    }
    if (this.noiseNode) {
      try {
        this.noiseNode.stop();
        this.noiseNode.disconnect();
      } catch {
        // ignore if already stopped
      }
      this.noiseNode = null;
    }
    if (this.noiseGain) {
      this.noiseGain.disconnect();
      this.noiseGain = null;
    }
    if (this.htmlAudio) {
      this.htmlAudio.pause();
    }
  }

  public pause() {
    this.isPlaying = false;
    this.pauseMediaSessionAnchor();
    if (this.activeTrack?.sourceType === 'local' && this.htmlAudio) {
      this.htmlAudio.pause();
    } else {
      this.stopCurrentSource();
    }
  }

  public stop() {
    this.isPlaying = false;
    this.currentTime = 0;
    this.pauseMediaSessionAnchor();
    this.stopCurrentSource();
    if (this.htmlAudio) {
      this.htmlAudio.pause();
      this.htmlAudio.currentTime = 0;
    }
    this.onTimeUpdateCb?.(0);
  }

  public async resume() {
    if (!this.activeTrack) return;
    this.ensureContext();
    this.isPlaying = true;
    if (this.activeTrack.sourceType === 'local' && this.htmlAudio) {
      try {
        await this.htmlAudio.play();
      } catch {
        // ignore
      }
    } else {
      this.startMediaSessionAnchor();
      this.startSynthAudio(this.activeTrack, this.currentTime);
    }
  }

  public seek(seconds: number) {
    if (!this.activeTrack) return;
    const clamped = Math.max(0, Math.min(seconds, this.activeTrack.duration));
    this.currentTime = clamped;
    this.onTimeUpdateCb?.(clamped);

    if (this.activeTrack.sourceType === 'local' && this.htmlAudio) {
      this.htmlAudio.currentTime = clamped;
    } else if (this.isPlaying) {
      this.stopCurrentSource();
      this.startSynthAudio(this.activeTrack, clamped);
    }
  }

  public setVolume(val: number) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.04);
    }
  }

  public setEqBands(bands: [number, number, number, number, number]) {
    this.eqBands = bands;
    if (this.eqFilters.length && this.ctx) {
      bands.forEach((db, idx) => {
        this.eqFilters[idx].gain.setTargetAtTime(db, this.ctx!.currentTime, 0.05);
      });
    }
  }

  public setCaveReverb(enabled: boolean) {
    this.caveReverb = enabled;
    if (this.dryGain && this.wetGain && this.ctx) {
      this.dryGain.gain.setTargetAtTime(enabled ? 0.72 : 1.0, this.ctx.currentTime, 0.06);
      this.wetGain.gain.setTargetAtTime(enabled ? 0.42 : 0.0, this.ctx.currentTime, 0.06);
    }
  }

  public getFrequencyBars(barCount = 12): number[] {
    if (!this.analyser || !this.isPlaying) {
      return Array(barCount).fill(0.12);
    }
    const data = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(data);
    const step = Math.max(1, Math.floor(data.length / barCount));
    const bars: number[] = [];
    for (let i = 0; i < barCount; i++) {
      const val = data[i * step] ?? 0;
      bars.push(Math.max(0.12, Math.min(1, val / 220)));
    }
    return bars;
  }
}

export const audioEngine = new CaveAudioEngine();

export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
