import { completeJSON } from "./openai";

// "Activate" step: cold outreach, not cold investment — this only drafts a
// message. The app never sends anything; a human copies/sends it themselves.
export async function draftOutreach({ companyName, extracted, channel, sourceUrl }) {
  const system = `Draft a short, specific cold outreach message from a VC associate to a founder
discovered via ${channel}. Reference something concrete about their public work, not generic
flattery. Goal: get them to submit a real application, not to pitch investment terms. 3-5
sentences. Return strict JSON: { "subject": string, "body": string }`;

  const user = `Company/project: ${companyName}
Source: ${sourceUrl}
What we know: ${JSON.stringify(extracted?.snapshot || {})}`;

  return completeJSON({ system, user });
}
