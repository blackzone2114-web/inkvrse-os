export const LINK_WAKE_PATTERN = /(?:^|\b)(?:hey\s+)?link\b[\s,:-]*/i;

export function extractLinkCommand(transcript: string) {
  const match = transcript.match(LINK_WAKE_PATTERN);
  if (!match) return null;
  return transcript.slice((match.index ?? 0) + match[0].length).trim();
}

export function getLinkGreeting(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return "Good morning, sir.";
  if (hour < 18) return "Good afternoon, sir.";
  return "Good evening, sir.";
}

export function selectLinkVoice(voices: SpeechSynthesisVoice[]) {
  const preferred = voices.filter((voice) => /^en-(AU|GB)/i.test(voice.lang));
  return preferred.find((voice) => /male|daniel|arthur|oliver|james/i.test(voice.name)) ?? preferred[0] ?? voices.find((voice) => /^en/i.test(voice.lang)) ?? null;
}
