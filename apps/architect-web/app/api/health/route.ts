import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabaseConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
  const livekitConfigured = Boolean(
    process.env.NEXT_PUBLIC_LIVEKIT_URL && process.env.LIVEKIT_API_KEY && process.env.LIVEKIT_API_SECRET,
  );

  return NextResponse.json(
    {
      ok: true,
      service: "architect-os",
      assistant: "LiNK",
      mode: supabaseConfigured ? "configured" : "safe-preview",
      integrations: {
        supabase: supabaseConfigured,
        livekit: livekitConfigured,
      },
      timestamp: new Date().toISOString(),
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
