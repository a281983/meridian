import { NextResponse } from "next/server";
import { getRecord, upsertRecord } from "@/lib/store";
import { generateMemo } from "@/lib/memo";

export async function GET(_req, { params }) {
  const { id } = await params;
  const opportunity = await getRecord("opportunities", id);
  if (!opportunity) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  if (opportunity.memo) {
    return NextResponse.json({ opportunity });
  }

  const memo = await generateMemo({
    companyName: opportunity.companyName,
    extracted: opportunity.extracted,
    trustScores: opportunity.trustScores,
    axisScores: opportunity.axisScores,
    founderScore: opportunity.founderScoreSnapshot,
  });

  const updated = await upsertRecord("opportunities", { ...opportunity, memo });
  return NextResponse.json({ opportunity: updated });
}
