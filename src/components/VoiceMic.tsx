import React, { useEffect, useState, useRef } from "react";
import { Mic, MicOff } from "lucide-react";
import { transcribeAudio } from "../services/transcribe";
import { ttsProvider } from "../services/tts";

export const VoiceMic: React.FC<{ onTranscript: (text: string)=>void | Promise<void>; onError?: (message: string)=>void; disabled?: boolean }> = ({ onTranscript, onError, disabled }) => {
  const [listening, setListening] = useState(false);
  const [processing, setProcessing] = useState(false);
  const recRef = useRef<MediaRecorder|null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef(0);
  useEffect(() => () => {
    const recorder = recRef.current;
    if (recorder?.state === "recording") { recorder.ondataavailable = null; recorder.onstop = null; recorder.stop(); }
    recorder?.stream.getTracks().forEach(track => track.stop());
  }, []);
  const handle = async () => {
    if (listening) { recRef.current?.stop(); return; }
    try {
      ttsProvider.stop();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: { ideal: true }, noiseSuppression: { ideal: true }, autoGainControl: { ideal: true }, channelCount: { ideal: 1 } } });
      const mimeType = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus"].find(type => MediaRecorder.isTypeSupported(type));
      const mr = mimeType ? new MediaRecorder(stream, { mimeType, audioBitsPerSecond: 128000 }) : new MediaRecorder(stream);
      chunksRef.current = [];
      startedAtRef.current = Date.now();
      mr.ondataavailable = e=>{ if(e.data.size>0) chunksRef.current.push(e.data); };
      mr.onstop = async () => {
        setListening(false); recRef.current = null; stream.getTracks().forEach(t=>t.stop());
        const blob = new Blob(chunksRef.current, { type: mr.mimeType });
        if (Date.now() - startedAtRef.current < 600 || blob.size < 500) { onError?.("Recording was too short. Hold the microphone, speak clearly, then press it again."); return; }
        setProcessing(true);
        try { const text = await transcribeAudio(blob); if(text) await onTranscript(text); else onError?.("I couldn't hear any speech. Try again closer to the microphone."); }
        catch { onError?.("Voice recognition is unavailable. You can type your question instead."); }
        finally { setProcessing(false); }
      };
      mr.onerror = () => { setListening(false); stream.getTracks().forEach(track => track.stop()); onError?.("The microphone stopped unexpectedly. Please try again."); };
      mr.start(250); recRef.current = mr; setListening(true);
    } catch { onError?.("Microphone access was blocked. Allow microphone permission or type your question."); }
  };
  return (
    <button onClick={handle} disabled={disabled || processing} aria-label={processing ? "Transcribing voice input" : listening?"Stop listening":"Start voice input"} className={`btn btn-square btn-md shrink-0 sm:btn-lg ${listening?"btn-error animate-pulse":"btn-primary"}`}>
      {listening ? <MicOff className="w-5 h-5"/> : <Mic className="w-5 h-5"/>}
    </button>
  );
};
