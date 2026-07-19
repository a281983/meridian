import { NextResponse } from "next/server";

// Diagnostic: reports which integrations are configured in this deployment.
// Booleans only — never the values. Safe to remove once wiring is confirmed.
export async function GET() {
  return NextResponse.json({
    openai: !!process.env.OPENAI_API_KEY,
    tavily: !!process.env.TAVILY_API_KEY,
    blobRWToken: !!process.env.BLOB_READ_WRITE_TOKEN,
    blobStoreId: !!process.env.BLOB_STORE_ID,
    oidc: !!process.env.VERCEL_OIDC_TOKEN,
  });
}
