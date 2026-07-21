import {
  WorkerOptions,
  cli,
  defineAgent,
  getJobContext,
  inference,
  llm,
  voice,
} from "@livekit/agents";
import * as silero from "@livekit/agents-plugin-silero";
import { fileURLToPath } from "node:url";

const timezone = process.env.LINK_TIMEZONE || "Australia/Melbourne";
const agentName = process.env.LINK_AGENT_NAME || "architect-link";

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

function getFrontendParticipant() {
  const room = getJobContext().room;
  const participant = Array.from(room.remoteParticipants.values())[0];
  if (!participant) throw new llm.ToolError("No Architect OS client is connected.");
  return { room, participant };
}

async function navigateFrontend(path) {
  const { room, participant } = getFrontendParticipant();
  return room.localParticipant.performRpc({
    destinationIdentity: participant.identity,
    method: "architect.navigate",
    payload: path,
    responseTimeout: 5000,
  });
}

async function requestActionFrontend(action) {
  const { room, participant } = getFrontendParticipant();
  return room.localParticipant.performRpc({
    destinationIdentity: participant.identity,
    method: "architect.request_action",
    payload: JSON.stringify(action),
    responseTimeout: 8000,
  });
}

const openWargame = llm.tool({
  name: "open_wargame",
  description: "Open the authenticated Architect OS Wargame workspace when the user explicitly asks to open, show, or go to Wargame.",
  execute: async () => navigateFrontend("/wargame"),
});

const openCommand = llm.tool({
  name: "open_command",
  description: "Return the authenticated Architect OS interface to the main Command workspace when the user explicitly asks to open or return to Command.",
  execute: async () => navigateFrontend("/"),
});

const openApprovals = llm.tool({
  name: "open_approvals",
  description: "Open the Architect OS approvals inbox when the user asks to review approvals or pending actions.",
  execute: async () => navigateFrontend("/approvals"),
});

const requestGovernedAction = llm.tool({
  name: "request_governed_action",
  description: "Submit a consequential Architect OS action to the permission engine. Use this instead of claiming execution whenever an action could change data, external systems, production state, authentication, privacy, payments, or anything permission-gated. This tool only requests permission; it does not execute the action.",
  parameters: {
    type: "object",
    properties: {
      toolName: { type: "string", description: "The real tool or subsystem that would perform the action." },
      action: { type: "string", description: "Short action identifier, such as update_project or deploy_preview." },
      summary: { type: "string", description: "Plain-language description of exactly what would happen." },
      permissionLevel: { type: "integer", minimum: 0, maximum: 3, description: "0 read/presentation, 1 low-risk reversible write, 2 consequential write, 3 critical or production-impacting action." },
      riskLevel: { type: "integer", minimum: 0, maximum: 100 },
      reversible: { type: "boolean" },
      affectsAuth: { type: "boolean" },
      affectsPrivacy: { type: "boolean" },
      affectsPayments: { type: "boolean" },
      destructive: { type: "boolean" },
      productionImpact: { type: "boolean" }
    },
    required: ["toolName", "action", "summary", "permissionLevel", "riskLevel", "reversible"],
    additionalProperties: false
  },
  execute: async (action) => requestActionFrontend(action),
});

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
- Treat the realtime room as an authenticated Architect OS session, but do not assume access to any external tool until that tool is explicitly connected and returns a result.
- UI navigation tools are safe presentation actions only. Never describe them as completing the underlying operational task.
- For any consequential action, call request_governed_action first. If approval is required, tell the user it has been queued for approval and do not claim execution.
- A permission approval is not proof of execution. Only a later execution receipt can prove that an external action succeeded.
`;

export default defineAgent({
  prewarm: async (proc) => {
    proc.userData.vad = await silero.VAD.load();
  },

  entry: async (ctx) => {
    const agent = new voice.Agent({
      instructions,
      tools: [openWargame, openCommand, openApprovals, requestGovernedAction],
    });

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
  agentName,
}));
