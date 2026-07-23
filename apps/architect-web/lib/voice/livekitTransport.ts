import { Room, RoomEvent, Track, type RemoteTrack } from "livekit-client";
import { publishLinkOutputStream } from "./outputBus";

export type LinkRealtimeConnection = {
  room: Room;
  disconnect: () => Promise<void>;
  setMicrophoneEnabled: (enabled: boolean) => Promise<void>;
};

type TokenResponse = {
  url: string;
  token: string;
  roomName: string;
  participantIdentity: string;
  agentName?: string;
};

async function getConnectionToken(): Promise<TokenResponse> {
  const response = await fetch("/api/livekit/token", {
    method: "POST",
    headers: { "content-type": "application/json" },
  });

  const payload = (await response.json()) as Partial<TokenResponse> & { error?: string };
  if (!response.ok || !payload.url || !payload.token || !payload.roomName || !payload.participantIdentity) {
    throw new Error(payload.error ?? "Unable to create LiNK realtime session.");
  }

  return payload as TokenResponse;
}

function isAllowedArchitectPath(path: string) {
  return path === "/" || path === "/wargame" || path === "/approvals";
}

async function requestGovernedAction(payload: string) {
  let parsed: unknown;
  try {
    parsed = JSON.parse(payload);
  } catch {
    throw new Error("Governed action payload was not valid JSON.");
  }

  const response = await fetch("/api/permissions/request", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(parsed),
  });
  const result = await response.json();
  if (!response.ok && response.status !== 202) {
    throw new Error(result?.error ?? "Unable to submit governed action request.");
  }

  return JSON.stringify(result);
}

export async function connectLinkRealtime(): Promise<LinkRealtimeConnection> {
  const credentials = await getConnectionToken();
  const room = new Room({ adaptiveStream: true, dynacast: true });
  const attachedAudio = new Set<HTMLMediaElement>();

  room.localParticipant.registerRpcMethod("architect.navigate", async (data) => {
    const path = String(data.payload ?? "");
    if (!isAllowedArchitectPath(path)) {
      throw new Error("Navigation target is not permitted.");
    }

    window.location.assign(path);
    return JSON.stringify({ ok: true, path });
  });

  room.localParticipant.registerRpcMethod("architect.request_action", async (data) => {
    return requestGovernedAction(String(data.payload ?? ""));
  });

  const handleTrackSubscribed = (track: RemoteTrack) => {
    if (track.kind !== Track.Kind.Audio) return;

    const element = track.attach();
    element.autoplay = true;
    element.style.display = "none";
    document.body.appendChild(element);
    attachedAudio.add(element);

    const stream = new MediaStream([track.mediaStreamTrack]);
    publishLinkOutputStream(stream);
    void element.play().catch(() => {
      // A user gesture may still be required by the browser. The room remains
      // connected and can resume audio after the next explicit interaction.
    });
  };

  const handleTrackUnsubscribed = (track: RemoteTrack) => {
    if (track.kind !== Track.Kind.Audio) return;
    for (const element of track.detach()) {
      attachedAudio.delete(element);
      element.remove();
    }
  };

  room.on(RoomEvent.TrackSubscribed, handleTrackSubscribed);
  room.on(RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed);

  await room.connect(credentials.url, credentials.token, { autoSubscribe: true });

  return {
    room,
    async setMicrophoneEnabled(enabled: boolean) {
      await room.localParticipant.setMicrophoneEnabled(enabled, {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      });
    },
    async disconnect() {
      room.off(RoomEvent.TrackSubscribed, handleTrackSubscribed);
      room.off(RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed);
      room.localParticipant.unregisterRpcMethod("architect.navigate");
      room.localParticipant.unregisterRpcMethod("architect.request_action");
      await room.localParticipant.setMicrophoneEnabled(false).catch(() => undefined);
      room.disconnect();
      for (const element of attachedAudio) element.remove();
      attachedAudio.clear();
    },
  };
}
