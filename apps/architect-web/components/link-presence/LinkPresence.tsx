"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type PresenceState = "dormant" | "listening" | "processing" | "speaking" | "error";

const LED_COUNT = 20;

function getGreeting(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return "Good morning, sir.";
  if (hour < 18) return "Good afternoon, sir.";
  return "Good evening, sir.";
}

export function LinkPresence() {
  const [state, setState] = useState<PresenceState>("dormant");
  const [level, setLevel] = useState(0);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const litSegments = useMemo(() => Math.round(level * LED_COUNT), [level]);

  useEffect(() => {
    if (state !== "speaking") return;
    let frame = 0;
    const tick = () => {
      // Phase-one stand-in. LiveKit output audio will replace this envelope.
      const syntheticVoiceEnvelope = 0.28 + Math.abs(Math.sin(performance.now() / 92)) * 0.72;
      setLevel(syntheticVoiceEnvelope);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [state]);

  const speakGreeting = () => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(getGreeting());
    utterance.rate = 0.93;
    utterance.pitch = 0.86;
    utterance.onstart = () => setState("speaking");
    utterance.onend = () => {
      setLevel(0);
      setState("dormant");
    };
    utterance.onerror = () => setState("error");
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const activate = () => {
    setState("listening");
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      speakGreeting();
      return;
    }
    const recognition = new Recognition();
    recognition.lang = "en-AU";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = () => {
      setState("processing");
      window.setTimeout(speakGreeting, 260);
    };
    recognition.onerror = () => setState("error");
    recognition.onend = () => setState((current) => current === "listening" ? "dormant" : current);
    recognitionRef.current = recognition;
    recognition.start();
  };

  return (
    <button className="link-presence" data-state={state} onClick={activate} aria-label={`LiNK status: ${state}`}>
      <div className="link-image-shell">
        <img src="/brand/link-canon.png" alt="LiNK canonical black and gold emblem" />
        <div className="led-overlay" aria-hidden="true">
          {[0.78, 1, 0.78].map((gain, barIndex) => (
            <div className="led-bar" key={barIndex}>
              {Array.from({ length: LED_COUNT }, (_, index) => {
                const distanceFromCentre = Math.abs(index - (LED_COUNT - 1) / 2);
                const centreRank = Math.ceil(LED_COUNT / 2 - distanceFromCentre);
                const active = centreRank <= Math.round(litSegments * gain * 0.5);
                return <span key={index} className={active ? "active" : ""} />;
              })}
            </div>
          ))}
        </div>
      </div>
      <span className="link-status">{state === "dormant" ? "LiNK ready" : state}</span>
    </button>
  );
}
