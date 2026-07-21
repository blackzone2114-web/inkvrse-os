import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { RoomAgentDispatch, RoomConfiguration } from "@livekit/protocol";
import { AccessToken } from "livekit-server-sdk";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });

  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const { data: workspaces } = await supabase
    .from("workspaces")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(1);

  const workspace = workspaces?.[0];
  if (!workspace) return NextResponse.json({ error: "No workspace is available." }, { status: 409 });

  const url = process.env.NEXT_PUBLIC_LIVEKIT_URL;
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  if (!url || !apiKey || !apiSecret) {
    return NextResponse.json({ error: "LiveKit is not configured." }, { status: 503 });
  }

  const agentName = process.env.LINK_AGENT_NAME || "architect-link";
  // A unique room per activation guarantees token-based explicit dispatch is applied
  // at room creation instead of being ignored because an old room already exists.
  const roomName = `architect-${workspace.id}-${randomUUID()}`;
  const token = new AccessToken(apiKey, apiSecret, {
    identity: user.id,
    name: user.email ?? "Architect OS User",
    ttl: "15m",
  });

  token.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  });

  token.roomConfig = new RoomConfiguration({
    agents: [
      new RoomAgentDispatch({
        agentName,
        metadata: JSON.stringify({
          workspaceId: workspace.id,
          userId: user.id,
        }),
      }),
    ],
  });

  return NextResponse.json({
    url,
    roomName,
    participantIdentity: user.id,
    agentName,
    token: await token.toJwt(),
  });
}