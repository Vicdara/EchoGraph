// Browser-native Web Audio API Sonification
// Translates graph trends into rising/falling auditory pitch frequencies

class SonificationService {
  private audioCtx: AudioContext | null = null;
  private isPlayingState: boolean = false;

  private initContext() {
    if (!this.audioCtx && typeof window !== "undefined") {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
  }

  public isAvailable(): boolean {
    return typeof window !== "undefined" && ("AudioContext" in window || "webkitAudioContext" in window);
  }

  public isPlaying(): boolean {
    return this.isPlayingState;
  }

  /**
   * Play an array of numbers (e.g. 0-100) as musical pitch tones
   */
  public async playDataCurve(values: number[], durationPerToneSec: number = 0.25): Promise<void> {
    if (!values || values.length === 0) return;

    this.initContext();
    if (!this.audioCtx) return;

    if (this.audioCtx.state === "suspended") {
      await this.audioCtx.resume();
    }

    this.isPlayingState = true;

    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const range = maxVal - minVal || 1;

    // Map 0..100 onto musical frequency range: 220Hz (A3) to 880Hz (A5)
    const minFreq = 220;
    const maxFreq = 880;

    const startTime = this.audioCtx.currentTime + 0.05;

    for (let i = 0; i < values.length; i++) {
      const val = values[i];
      const normalized = (val - minVal) / range;
      const freq = minFreq + normalized * (maxFreq - minFreq);

      const toneStart = startTime + i * durationPerToneSec;
      const toneEnd = toneStart + durationPerToneSec;

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, toneStart);

      // Smooth attack and release envelope to prevent audible clicks
      gain.gain.setValueAtTime(0.001, toneStart);
      gain.gain.exponentialRampToValueAtTime(0.3, toneStart + 0.03);
      gain.gain.setValueAtTime(0.3, toneEnd - 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, toneEnd);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(toneStart);
      osc.stop(toneEnd);
    }

    const totalDurationMs = (values.length * durationPerToneSec + 0.1) * 1000;
    setTimeout(() => {
      this.isPlayingState = false;
    }, totalDurationMs);
  }
}

export const sonificationService = new SonificationService();
