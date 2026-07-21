export type LinkVoiceState = "idle" | "connecting" | "listening" | "thinking" | "speaking" | "error";

export type LinkVoiceEvent =
  | { type: "state"; state: LinkVoiceState }
  | { type: "transcript"; text: string; final: boolean }
  | { type: "audio-stream"; stream: MediaStream }
  | { type: "error"; message: string };

export type LinkVoiceEventHandler = (event: LinkVoiceEvent) => void;

export interface LinkVoiceTransport {
  readonly kind: "browser" | "livekit";
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  speak(text: string): Promise<void>;
  interrupt(): Promise<void>;
  subscribe(handler: LinkVoiceEventHandler): () => void;
}

export type LinkCommandRoute =
  | { kind: "greeting" }
  | { kind: "wargame"; prompt: string }
  | { kind: "command"; prompt: string }
  | { kind: "unknown"; prompt: string };
