import { NextResponse } from "next/server";
import { extractDeckText } from "@/lib/pdf";
import { processInboundApplication } from "@/lib/pipeline";
import { getSession } from "@/lib/session";

// Minimum bar per the brief: deck + company name. Founder identity comes from the
// session, not the form, so the application is bound to the signed-in founder.
//
// Two intake shapes:
//  - JSON { deckPathname }  → the browser already uploaded the PDF straight to
//    Blob (large decks, up to 20 MB); we read it back here. Preferred in prod.
//  - multipart (deck file)  → the file is sent through the function (small decks,
//    ~4.5 MB cap). Fallback for local dev / when Blob isn't configured.
export async function POST(req) {
  const session = await getSession();
  if (!session || session.role !== "founder") {
    return NextResponse.json({ error: "Sign in as a founder to apply." }, { status: 401 });
  }

  const contentType = req.headers.get("content-type") || "";
  let companyName, extra, githubHandle, linkedinUrl, deckBuffer;

  if (contentType.includes("application/json")) {
    const body = await req.json();
    companyName = body.companyName;
    extra = body.extra || "";
    githubHandle = body.githubHandle || null;
    linkedinUrl = body.linkedinUrl || null;

    if (!companyName || !body.deckPathname) {
      return NextResponse.json({ error: "companyName and deck are required." }, { status: 400 });
    }

    const { get, del } = await import("@vercel/blob");
    const result = await get(body.deckPathname, { access: "private", useCache: false });
    if (!result || result.statusCode !== 200 || !result.stream) {
      return NextResponse.json({ error: "Could not read the uploaded deck." }, { status: 400 });
    }
    deckBuffer = Buffer.from(await new Response(result.stream).arrayBuffer());
    // We only needed the text — remove the temporary deck blob.
    try {
      await del(body.deckPathname);
    } catch {
      /* best-effort cleanup */
    }
  } else {
    const form = await req.formData();
    companyName = form.get("companyName");
    extra = form.get("extra") || "";
    githubHandle = form.get("githubHandle") || null;
    linkedinUrl = form.get("linkedinUrl") || null;
    const deckFile = form.get("deck");

    if (!companyName || !deckFile) {
      return NextResponse.json({ error: "companyName and deck (PDF) are required." }, { status: 400 });
    }
    deckBuffer = Buffer.from(await deckFile.arrayBuffer());
  }

  const deckText = await extractDeckText(deckBuffer);
  const founder = { name: session.name, email: session.email, githubHandle, linkedinUrl };

  const opportunity = await processInboundApplication({
    companyName,
    deckText,
    extra,
    founder,
    ownerEmail: session.email,
  });

  return NextResponse.json({ opportunity });
}
