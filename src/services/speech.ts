import { ChartDescription } from "../types";

class SpeechService {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isSpeakingState: boolean = false;
  private onStateChangeCallbacks: Array<(speaking: boolean) => void> = [];

  constructor() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      this.synth = window.speechSynthesis;
    }
  }

  public isAvailable(): boolean {
    return this.synth !== null;
  }

  public onStateChange(cb: (speaking: boolean) => void) {
    this.onStateChangeCallbacks.push(cb);
    return () => {
      this.onStateChangeCallbacks = this.onStateChangeCallbacks.filter((c) => c !== cb);
    };
  }

  private setSpeaking(val: boolean) {
    this.isSpeakingState = val;
    this.onStateChangeCallbacks.forEach((cb) => cb(val));
  }

  public getIsSpeaking(): boolean {
    return this.isSpeakingState || (this.synth?.speaking ?? false);
  }

  public stop(): void {
    if (this.synth) {
      this.synth.cancel();
      this.setSpeaking(false);
      this.currentUtterance = null;
    }
  }

  public formatScriptForSpeech(desc: ChartDescription): string {
    return `Summary. ${desc.summary}. 
    Structure. ${desc.structure}. 
    The Data. ${desc.data}. 
    Why It Matters. ${desc.whyItMatters}`;
  }

  public speak(text: string, rate: number = 1.0): Promise<void> {
    return new Promise((resolve) => {
      if (!this.synth) {
        console.warn("SpeechSynthesis API not available in this browser.");
        resolve();
        return;
      }

      this.stop();

      // Small timeout to allow any pending speech cancellations to clear
      setTimeout(() => {
        try {
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.rate = rate;
          utterance.pitch = 1.0;
          utterance.lang = "en-US";

          // Try to select a clear English voice if available
          const voices = this.synth?.getVoices() || [];
          const preferredVoice =
            voices.find((v) => v.lang.startsWith("en") && (v.name.includes("Natural") || v.name.includes("Enhanced") || v.name.includes("Google") || v.name.includes("Samantha"))) ||
            voices.find((v) => v.lang.startsWith("en")) ||
            voices[0];

          if (preferredVoice) {
            utterance.voice = preferredVoice;
          }

          utterance.onstart = () => {
            this.setSpeaking(true);
          };

          utterance.onend = () => {
            this.setSpeaking(false);
            this.currentUtterance = null;
            resolve();
          };

          utterance.onerror = (e) => {
            console.error("Speech synthesis error:", e);
            this.setSpeaking(false);
            this.currentUtterance = null;
            // Don't reject aggressively to prevent unhandled promise rejection in UI
            resolve();
          };

          this.currentUtterance = utterance;
          this.synth?.speak(this.currentUtterance);
        } catch (err) {
          console.error("SpeechSynthesis execution error:", err);
          this.setSpeaking(false);
          resolve();
        }
      }, 50);
    });
  }

  public speakDescription(desc: ChartDescription, rate: number = 1.0): Promise<void> {
    const speechScript = this.formatScriptForSpeech(desc);
    return this.speak(speechScript, rate);
  }
}

export const speechService = new SpeechService();
