import { NextResponse } from "next/server";
import { getRecord, upsertRecord } from "@/lib/store";
import { draftOutreach } from "@/lib/outreach";

// Drafts outreach copy only — this app never sends messages on a founder's
// behalf. A human reviews and sends it themselves.
export async function POST(_req, { params }) {
  const { id } = await params;
  const opportunity = await getRecord("opportunities", id);
  if (!opportunity) return NextResponse.json({ error: "not found" }, { status: 404 });

  const outreach = await draftOutreach({
    companyName: opportunity.companyName,
    extracted: opportunity.extracted,
    channel: opportunity.channel,
    sourceUrl: opportunity.sourceUrl,
  });

  const updated = await upsertRecord("opportunities", {
    ...opportunity,
    status: "activated",
    outreach,
  });

  return NextResponse.json({ opportunity: updated });
}
