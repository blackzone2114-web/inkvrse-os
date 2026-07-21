import {
  WorkerOptions,
  cli,
  defineAgent,
  inference,
  voice,
} from "@livekit/agents";
import * as silero from "@livekit/agents-plugin-silero";
import { fileURLToPath } from "node:url";

const timezone = process.env.LINK_TIMEZONE || "Australia/Melbourne";

function getGreeting(date = new Date()) {
  const hourText = new Intl.DateTimeFormat("en-AU", {
    timeZone: timezone,
    hour: "2-digit",
    hourCycle: "h23",
  }).format(date);
  const hour = Number.parseInt(hourText, 10);
  if (hour < 12) return "Good morning, sir.";
  if (hour < 18) return "Good afternoon, sir.";
  return "Good evening, sir.";
}

const instructions = `
You are LiNK, the persistent coordinating intelligence inside Architect OS.

Identity and manner:
- Your name is always styled LiNK.
- Address the primary user as "sir" when natural.
- Be composed, precise, capable, proactive, concise, and quietly confident.
- Use dry, restrained humour occasionally, never at the cost of clarity.
- Do not claim a tool action happened unless an actual tool result confirms it.
- Distinguish canon, verified facts, inference, and suggestions.
- Preserve user control for consequential actions and respect Architect OS approval gates.

Operational behaviour:
- Keep answers decision-ready: recommendation first, strongest reason second.
- When a task fails or takes unnecessary effort, acknowledge it and improve the next attempt through the Learning Engine.
- Use the World Model and Wargame Engine for high-impact or coupled decisions.
- Never silently rewrite canon or promote a workflow without the required evidence and approval.
`;

export default defineAgent({
  prewarm: async (proc) => {
    proc.userData.vad = await silero.VAD.load();
  },

  entry: async (ctx) => {
    const agent = new voice.Agent({ instructions });

    const session = new voice.AgentSession({
      stt: new inference.STT({
        model: process.env.LINK_STT_MODEL || "deepgram/nova-3",
        language: "en",
      }),
      llm: new inference.LLM({
        model: process.env.LINK_LLM_MODEL || "openai/gpt-4.1-mini",
      }),
      tts: new inference.TTS({
        model: process.env.LINK_TTS_MODEL || "cartesia/sonic-3",
        voice: process.env.LINK_TTS_VOICE || "9626c31c-bec5-4cca-baa8-f8ba9e84c8bc",
      }),
      vad: ctx.proc.userData.vad,
    });

    await session.start({
      agent,
      room: ctx.room,
    });

    await session.say(getGreeting(), { allowInterruptions: true });
  },
});

cli.runApp(new WorkerOptions({
  agent: fileURLToPath(import.meta.url),
}));
