import { NextResponse } from "next/server";
import { extractDeckText } from "@/lib/pdf";
import { processInboundApplication } from "@/lib/pipeline";
import { getSession } from "@/lib/session";

// Minimum bar per the brief: deck + company name. Everything else is optional
// enrichment — resist adding required fields beyond this. Founder identity comes
// from the session, not the form, so the application is bound to the signed-in
// founder (and shows up on their founder home).
export async function POST(req) {
  const session = await getSession();
  if (!session || session.role !== "founder") {
    return NextResponse.json({ error: "Sign in as a founder to apply." }, { status: 401 });
  }

  const form = await req.formData();
  const companyName = form.get("companyName");
  const deckFile = form.get("deck");
  const extra = form.get("extra") || "";
  const founder = {
    name: session.name,
    email: session.email,
    githubHandle: form.get("githubHandle") || null,
    linkedinUrl: form.get("linkedinUrl") || null,
  };

  if (!companyName || !deckFile) {
    return NextResponse.json(
      { error: "companyName and deck (PDF) are required." },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await deckFile.arrayBuffer());
  const deckText = await extractDeckText(buffer);

  const opportunity = await processInboundApplication({
    companyName,
    deckText,
    extra,
    founder,
    ownerEmail: session.email,
  });

  return NextResponse.json({ opportunity });
}
