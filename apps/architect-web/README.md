# Architect OS — LiNK Foundation

Phase-one command interface for Architect OS.

## Canon asset

Place the approved LiNK source-of-truth PNG at:

`public/brand/link-canon.png`

Do not redraw, recolour, crop, regenerate or alter the approved asset. The animation layer is rendered separately over the canonical image.

## Run

```bash
cd apps/architect-web
npm install
npm run dev
```

Open `http://localhost:3000`.

## Implemented

- Cinematic black/gold Command shell
- Persistent LiNK presence component
- Dormant, listening, processing, speaking and error states
- Local-time greeting: morning, afternoon or evening
- Browser speech-recognition activation fallback
- Three centre-out gold LED bars
- Fade at the top and bottom LED segments
- Mobile command layout

## Next engineering pass

1. Add the canonical PNG asset.
2. Replace the phase-one synthetic speaking envelope with analysis of the actual LiveKit/TTS output track.
3. Add wake-word detection for “LiNK”.
4. Add Supabase authentication, memory and canon tables.
5. Add permission-gated GitHub, Gmail and Calendar tools with receipts.
