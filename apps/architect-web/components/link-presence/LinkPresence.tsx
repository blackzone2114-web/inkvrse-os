"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { extractLinkCommand, getLinkGreeting, selectLinkVoice } from "@/lib/voice/linkVoice";

type PresenceState = "dormant" | "listening" | "processing" | "speaking" | "error";

const LED_COUNT = 20;

export function LinkPresence() {
  const [state, setState] = useState<PresenceState>("dormant");
  const [level, setLevel] = useState(0);
  const [heard, setHeard] = useState("");
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const speakingRef = useRef(false);

  const litSegments = useMemo(() => Math.round(level * LED_COUNT), [level]);

  const stopSpeaking = () => {
    if (!speakingRef.current) return;
    window.speechSynthesis.cancel();
    speakingRef.current = false;
    setLevel(0);
    setState("listening");
  };

  const speak = (text: string) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.93;
    utterance.pitch = 0.86;
    const voice = selectLinkVoice(window.speechSynthesis.getVoices());
    if (voice) utterance.voice = voice;
    utterance.onstart = () => {
      speakingRef.current = true;
      setState("speaking");
    };
    utterance.onend = () => {
      speakingRef.current = false;
      setLevel(0);
      setState("listening");
    };
    utterance.onerror = () => {
      speakingRef.current = false;
      setState("error");
    };
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    if (state !== "speaking") return;
    let frame = 0;
    const tick = () => {
      // Browser speechSynthesis does not expose its output PCM. This envelope remains
      // a truthful fallback until LiveKit/TTS supplies an analysable MediaStream.
      const envelope = 0.22 + Math.abs(Math.sin(performance.now() / 86)) * 0.78;
      setLevel(envelope);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [state]);

  const startListening = () => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      speak(getLinkGreeting());
      return;
    }

    recognitionRef.current?.abort();
    const recognition = new Recognition();
    recognition.lang = "en-AU";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      const result = event.results[event.results.length - 1];
      const transcript = result?.[0]?.transcript?.trim() ?? "";
      if (!transcript) return;
      setHeard(transcript);

      const command = extractLinkCommand(transcript);
      if (command === null) return;

      if (speakingRef.current) stopSpeaking();
      if (!result.isFinal) return;

      setState("processing");
      if (!command) {
        window.setTimeout(() => speak(getLinkGreeting()), 140);
        return;
      }

      // Command routing lands next. For now LiNK confirms wake capture without
      // fabricating execution of an unconnected tool or agent action.
      window.setTimeout(() => speak(`${getLinkGreeting()} I heard your command.`), 140);
    };

    recognition.onerror = (event) => {
      if (event.error === "aborted") return;
      setState("error");
    };
    recognition.onend = () => setState((current) => current === "listening" ? "dormant" : current);
    recognitionRef.current = recognition;
    setState("listening");
    recognition.start();
  };

  useEffect(() => () => {
    recognitionRef.current?.abort();
    window.speechSynthesis.cancel();
  }, []);

  const activate = () => {
    if (state === "speaking") {
      stopSpeaking();
      return;
    }
    startListening();
  };

  return (
    <button className="link-presence" data-state={state} onClick={activate} aria-label={`LiNK status: ${state}`} title={heard ? `Last heard: ${heard}` : "Say LiNK to wake"}>
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
      <span className="link-status">{state === "dormant" ? "LiNK ready · say LiNK" : state}</span>
    </button>
  );
}
