"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createAudioLevelAnalyser } from "@/lib/voice/audioAnalyser";
import { routeLinkCommand } from "@/lib/voice/commandRouter";
import { extractLinkCommand, getLinkGreeting, selectLinkVoice } from "@/lib/voice/linkVoice";
import { connectLinkRealtime, type LinkRealtimeConnection } from "@/lib/voice/livekitTransport";
import { subscribeToLinkOutputStream } from "@/lib/voice/outputBus";

type PresenceState = "dormant" | "listening" | "processing" | "speaking" | "error";

const LED_COUNT = 20;

export function LinkPresence() {
  const [state, setState] = useState<PresenceState>("dormant");
  const [level, setLevel] = useState(0);
  const [heard, setHeard] = useState("");
  const [realtimeReady, setRealtimeReady] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const speakingRef = useRef(false);
  const realAudioActiveRef = useRef(false);
  const realtimeRef = useRef<LinkRealtimeConnection | null>(null);
  const realtimeConnectPromiseRef = useRef<Promise<LinkRealtimeConnection | null> | null>(null);
  const stopAnalyserRef = useRef<null | (() => Promise<void>)>(null);

  const litSegments = useMemo(() => Math.round(level * LED_COUNT), [level]);

  const ensureRealtime = async () => {
    if (realtimeRef.current) return realtimeRef.current;
    if (realtimeConnectPromiseRef.current) return realtimeConnectPromiseRef.current;

    realtimeConnectPromiseRef.current = connectLinkRealtime()
      .then(async (connection) => {
        realtimeRef.current = connection;
        setRealtimeReady(true);
        recognitionRef.current?.abort();
        recognitionRef.current = null;
        await connection.setMicrophoneEnabled(true);
        setState("listening");
        return connection;
      })
      .catch(() => {
        setRealtimeReady(false);
        return null;
      })
      .finally(() => {
        realtimeConnectPromiseRef.current = null;
      });

    return realtimeConnectPromiseRef.current;
  };

  const stopBrowserSpeaking = () => {
    if (!speakingRef.current) return;
    window.speechSynthesis.cancel();
    speakingRef.current = false;
    if (!realAudioActiveRef.current) setLevel(0);
    setState("listening");
  };

  const speakFallback = (text: string) => {
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
      if (!realAudioActiveRef.current) setLevel(0);
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
    return subscribeToLinkOutputStream((stream) => {
      void stopAnalyserRef.current?.();
      realAudioActiveRef.current = true;
      setState("speaking");
      stopAnalyserRef.current = createAudioLevelAnalyser(stream, ({ smoothed }) => setLevel(smoothed));

      const track = stream.getAudioTracks()[0];
      if (track) {
        track.addEventListener("ended", () => {
          void stopAnalyserRef.current?.();
          stopAnalyserRef.current = null;
          realAudioActiveRef.current = false;
          setLevel(0);
          setState("listening");
        }, { once: true });
      }
    });
  }, []);

  useEffect(() => {
    if (state !== "speaking" || realAudioActiveRef.current) return;
    let frame = 0;
    const tick = () => {
      // Honest browser fallback only. A subscribed LiveKit/TTS MediaStream bypasses
      // this envelope and drives the LEDs from its measured PCM amplitude.
      const envelope = 0.22 + Math.abs(Math.sin(performance.now() / 86)) * 0.78;
      setLevel(envelope);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [state]);

  const startBrowserFallback = () => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      speakFallback(getLinkGreeting());
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

      if (speakingRef.current) stopBrowserSpeaking();
      if (!result.isFinal) return;

      setState("processing");
      const route = routeLinkCommand(command);

      if (route.kind === "greeting") {
        window.setTimeout(() => speakFallback(getLinkGreeting()), 140);
        return;
      }

      if (route.kind === "wargame") {
        window.setTimeout(() => speakFallback(`${getLinkGreeting()} Wargame command received. Open Wargame to review before execution.`), 140);
        return;
      }

      window.setTimeout(() => speakFallback(`${getLinkGreeting()} I heard your command.`), 140);
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
    void stopAnalyserRef.current?.();
    void realtimeRef.current?.disconnect();
  }, []);

  const activate = async () => {
    if (speakingRef.current) stopBrowserSpeaking();

    // LiveKit gets first refusal after an explicit gesture. When it connects,
    // its agent owns STT/LLM/TTS and the browser recognizer stays out of the way.
    const realtime = await ensureRealtime();
    if (realtime) {
      await realtime.setMicrophoneEnabled(true);
      setState("listening");
      return;
    }

    startBrowserFallback();
  };

  return (
    <button className="link-presence" data-state={state} onClick={() => void activate()} aria-label={`LiNK status: ${state}`} title={heard ? `Last heard: ${heard}` : "Activate LiNK"}>
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
      <span className="link-status">{state === "dormant" ? `LiNK ready · ${realtimeReady ? "realtime" : "fallback"}` : `${state} · ${realtimeReady ? "realtime" : "fallback"}`}</span>
    </button>
  );
}