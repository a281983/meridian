"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";

const MAX_BYTES = 20 * 1024 * 1024; // 20 MB hard cap

export default function ApplyForm({ applicantName, applicantEmail }) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);
  const router = useRouter();

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);

    const form = new FormData(e.target);
    const deck = form.get("deck");
    const companyName = form.get("companyName");

    if (deck && deck.size > MAX_BYTES) {
      setError(
        `That deck is ${(deck.size / 1048576).toFixed(1)} MB — the limit is 20 MB. Please use a smaller PDF.`
      );
      return;
    }

    setLoading(true);
    try {
      // Preferred path: upload the PDF straight to Blob from the browser. This
      // bypasses Vercel's ~4.5 MB function-request cap, so decks up to 20 MB work.
      // If Blob isn't configured (e.g. local dev), fall back to sending the file
      // through the API for the small-file case.
      let deckPathname = null;
      if (deck && deck.size > 0) {
        try {
          setStatus("Uploading deck…");
          const blob = await upload(deck.name, deck, {
            access: "private",
            contentType: "application/pdf",
            handleUploadUrl: "/api/deck-upload",
          });
          deckPathname = blob.pathname;
        } catch {
          deckPathname = null; // fall back below
        }
      }

      setStatus("Reading deck · scoring · verifying claims…");
      let res;
      if (deckPathname) {
        res = await fetch("/api/apply", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            companyName,
            deckPathname,
            githubHandle: form.get("githubHandle") || null,
            linkedinUrl: form.get("linkedinUrl") || null,
            extra: form.get("extra") || "",
          }),
        });
      } else {
        res = await fetch("/api/apply", { method: "POST", body: form });
      }

      if (!res.ok) {
        let msg = `Something went wrong (${res.status}).`;
        if (res.status === 413) {
          msg = "That deck was too large to send. Please use a PDF under 20 MB.";
        } else {
          try {
            const d = await res.json();
            if (d?.error) msg = d.error;
          } catch {
            /* non-JSON error response — keep the generic message */
          }
        }
        throw new Error(msg);
      }
      const data = await res.json();
      router.push(`/opportunity/${data.opportunity.id}`);
    } catch (err) {
      setError(err.message);
      setLoading(false);
      setStatus(null);
    }
  }

  const field =
    "w-full rounded-xl bg-[var(--surface)] border border-[var(--border)] px-3.5 py-2.5 text-sm text-[var(--text)] placeholder-[var(--faint)] focus:outline-none focus:border-[var(--border-strong)] transition";

  return (
    <form onSubmit={onSubmit} className="glass rounded-2xl p-6 sm:p-7 space-y-5">
      <p className="text-xs text-[var(--faint)]">
        Applying as <span className="text-[var(--muted)]">{applicantName} · {applicantEmail}</span>
      </p>

      <div>
        <label className="block text-sm font-medium mb-1.5">Company name <span className="text-[var(--neg)]">*</span></label>
        <input name="companyName" required className={field} placeholder="Acme AI" />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">Pitch deck (PDF) <span className="text-[var(--neg)]">*</span></label>
        <input
          name="deck"
          type="file"
          accept="application/pdf"
          required
          className="w-full text-sm text-[var(--muted)] file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--surface-2)] file:px-3 file:py-2 file:text-[var(--text)] file:text-sm"
        />
        <p className="text-xs text-[var(--faint)] mt-1.5">Deck + company name is all we need (PDF up to 20 MB). Everything below is optional.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">GitHub handle</label>
          <input name="githubHandle" className={field} placeholder="octocat" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">LinkedIn URL</label>
          <input name="linkedinUrl" className={field} placeholder="linkedin.com/in/…" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">Anything else worth knowing?</label>
        <textarea name="extra" rows={3} className={field} placeholder="Optional context…" />
      </div>

      {error && <p className="text-sm text-[var(--neg)]">{error}</p>}

      <button disabled={loading} className="btn-primary w-full py-3 text-sm disabled:opacity-60">
        {loading ? status || "Submitting…" : "Submit application"}
      </button>
    </form>
  );
}
