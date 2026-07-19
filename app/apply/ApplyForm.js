"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ApplyForm({ applicantName, applicantEmail }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const form = new FormData(e.target);
      const res = await fetch("/api/apply", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      router.push(`/opportunity/${data.opportunity.id}`);
    } catch (err) {
      setError(err.message);
      setLoading(false);
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
        <p className="text-xs text-[var(--faint)] mt-1.5">Deck + company name is all we need. Everything below is optional.</p>
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
        {loading ? "Reading deck · scoring · verifying claims…" : "Submit application"}
      </button>
    </form>
  );
}
