import { completeJSON } from "./openai";
import { getMemoSections } from "./config";

// The model is asked for a plain string but sometimes returns structured content
// (e.g. SWOT as {strengths, weaknesses, ...}) despite the prompt — React can't
// render an object as a child, so flatten anything non-string into readable text.
function flattenToText(value, depth = 0) {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    return value.map((v) => `${"  ".repeat(depth)}- ${flattenToText(v, depth + 1)}`).join("\n");
  }
  if (typeof value === "object") {
    return Object.entries(value)
      .map(([k, v]) => `${"  ".repeat(depth)}${k}: ${flattenToText(v, depth + 1)}`)
      .join("\n");
  }
  return String(value);
}

export async function generateMemo({ companyName, extracted, trustScores, axisScores, founderScore }) {
  const sections = getMemoSections();
  const allSections = [
    ...sections.required.map((s) => ({ ...s, required: true })),
    ...sections.optional.map((s) => ({ ...s, required: false })),
  ];

  const system = `You are drafting an investment memo section-by-section for "${companyName}".
Rules:
- As detailed as the decision requires, as brief as clarity allows. No padding.
- ${sections.missing_data_policy}
- Every material claim you state should be traceable to the extracted data or trust-score
  evidence given below — do not invent facts not present there.
- For required sections, always produce content, even if it's short and flags gaps.
- For optional sections, if there is not enough evidence to say anything real, return
  { "content": null, "flagged_missing": "<what's missing>" } instead of inventing content.
Return strict JSON: { "content": string|null, "flagged_missing": string|null }`;

  const context = JSON.stringify({ extracted, trustScores, axisScores, founderScore });

  const memoSections = await Promise.all(
    allSections.map(async (section) => {
      const user = `Section: "${section.title}"
What it should cover: ${section.prompt}

Company data, evidence, and scores:
${context}`;
      const result = await completeJSON({ system, user });
      return {
        id: section.id,
        title: section.title,
        required: section.required,
        ...result,
        content: result.content ? flattenToText(result.content) : null,
      };
    })
  );

  return { companyName, generatedAt: new Date().toISOString(), sections: memoSections };
}
