import { handleUpload } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

// Signs short-lived client tokens so the browser can upload a deck straight to
// Blob (bypassing the ~4.5 MB function-request cap). Auth happens here, in
// onBeforeGenerateToken — without it, anyone could upload to the store.
// Note: handleUpload requires BLOB_READ_WRITE_TOKEN (OIDC is not accepted here).
export async function POST(request) {
  const body = await request.json();
  try {
    const json = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        const session = await getSession();
        if (!session || session.role !== "founder") {
          throw new Error("Sign in as a founder to upload a deck.");
        }
        return {
          allowedContentTypes: ["application/pdf"],
          maximumSizeInBytes: 20 * 1024 * 1024, // 20 MB
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ email: session.email }),
        };
      },
      // The deck is read back by /api/apply immediately after upload, so we don't
      // rely on this webhook (it also doesn't fire on localhost).
      onUploadCompleted: async () => {},
    });
    return NextResponse.json(json);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
