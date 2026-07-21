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

export async function connectLinkRealtime(): Promise<LinkRealtimeConnection> {
  const credentials = await getConnectionToken();
  const room = new Room({ adaptiveStream: true, dynacast: true });
  const attachedAudio = new Set<HTMLMediaElement>();

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
      await room.localParticipant.setMicrophoneEnabled(false).catch(() => undefined);
      room.disconnect();
      for (const element of attachedAudio) element.remove();
      attachedAudio.clear();
    },
  };
}
