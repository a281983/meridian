import OpenAI from "openai";

let client;

export function getOpenAI() {
  if (!client) {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return client;
}

// Calls the model and forces a JSON object back — used everywhere we need
// structured output (extraction, scoring, memo sections) instead of prose.
export async function completeJSON({ system, user, model = "gpt-4o-mini" }) {
  const openai = getOpenAI();
  const res = await openai.chat.completions.create({
    model,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    response_format: { type: "json_object" },
    temperature: 0.2,
  });
  return JSON.parse(res.choices[0].message.content);
}
