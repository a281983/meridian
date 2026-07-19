"use client";
import { useState } from "react";

const PERSONA = {
  founder: { name: "Alex Rivera", email: "alex@demo.com" },
  investor: { name: "Dana Alvarez", email: "dana@meridian.vc" },
};

function GoogleG({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.8-6.8C35.6 2.4 30.1 0 24 0 14.6 0 6.4 5.4 2.5 13.2l7.9 6.1C12.3 13.2 17.7 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.5 3-2.2 5.5-4.7 7.2l7.3 5.7c4.3-4 6.9-9.9 6.9-17.4z" />
      <path fill="#FBBC05" d="M10.4 28.7a14.5 14.5 0 0 1 0-9.3l-7.9-6.1a24 24 0 0 0 0 21.6l7.9-6.2z" />
      <path fill="#34A853" d="M24 48c6.1 0 11.3-2 15-5.5l-7.3-5.7c-2 1.4-4.7 2.3-7.7 2.3-6.3 0-11.7-3.7-13.6-9.1l-7.9 6.2C6.4 42.6 14.6 48 24 48z" />
    </svg>
  );
}

export default function GoogleSignIn({ role, label }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const persona = PERSONA[role];

  async function signIn() {
    setBusy(true);
    await fetch("/api/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    // Hard navigation so the fresh session cookie is picked up cleanly and we
    // don't race the client router against the landing page's redirect.
    window.location.href = role === "investor" ? "/dashboard" : "/founder";
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-2.5 bg-white text-[#1f1f1f] font-medium rounded-xl px-4 py-3 text-sm hover:brightness-95 transition"
      >
        <GoogleG />
        {label || "Continue with Google"}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => !busy && setOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-[#1a1a1a] border border-white/10 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5 border-b border-white/10 flex items-center gap-3">
              <GoogleG size={22} />
              <span className="text-sm text-white/70">Sign in with Google</span>
            </div>
            <button
              onClick={signIn}
              disabled={busy}
              className="w-full flex items-center gap-3 px-6 py-4 hover:bg-white/5 transition text-left disabled:opacity-60"
            >
              <span
                className="h-9 w-9 rounded-full grid place-items-center text-sm font-semibold text-[#060913]"
                style={{ background: "var(--grad)" }}
              >
                {persona.name.split(" ").map((w) => w[0]).join("")}
              </span>
              <span>
                <span className="block text-sm text-white">{persona.name}</span>
                <span className="block text-xs text-white/50">{persona.email}</span>
              </span>
            </button>
            <p className="px-6 py-3 text-[11px] text-white/40 border-t border-white/10">
              Demo mode — no real Google account is used or accessed.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
