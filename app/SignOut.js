"use client";

export default function SignOut() {
  async function out() {
    await fetch("/api/session", { method: "DELETE" });
    window.location.href = "/";
  }
  return (
    <button onClick={out} className="text-sm text-[var(--muted)] hover:text-[var(--text)] transition">
      Sign out
    </button>
  );
}
