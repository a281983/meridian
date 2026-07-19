import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import GoogleSignIn from "./GoogleSignIn";

export default async function Landing() {
  const session = await getSession();
  if (session) redirect(session.role === "investor" ? "/dashboard" : "/founder");

  return (
    <main className="mx-auto max-w-5xl px-5">
      {/* Hero */}
      <section className="pt-20 sm:pt-28 pb-14 text-center">
        <span className="inline-block text-xs uppercase tracking-[0.2em] text-[var(--muted)] mb-6">
          The founder score that follows you
        </span>
        <h1
          className="text-5xl sm:text-7xl font-bold leading-[1.05] tracking-tight"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Capital, by <span className="gradient-text">merit</span>.
        </h1>
        <p className="mx-auto max-w-xl text-base sm:text-lg text-[var(--muted)] mt-6 leading-relaxed">
          Get funded for what you build, not who you know. Apply once — a living Founder
          Score follows you, and investors see your signal, not your network.
        </p>
      </section>

      {/* Two doors */}
      <section className="grid sm:grid-cols-2 gap-4 sm:gap-5 max-w-3xl mx-auto">
        <div className="glass rounded-2xl p-6 sm:p-7 flex flex-col">
          <h2 className="font-semibold text-xl" style={{ fontFamily: "var(--font-display)" }}>
            For Founders
          </h2>
          <p className="text-sm text-[var(--muted)] mt-2 flex-1">
            Submit a deck. Get a transparent read on your Founder Score and a 24-hour signal —
            no warm intro required.
          </p>
          <div className="mt-5">
            <GoogleSignIn role="founder" label="Continue as Founder" />
          </div>
        </div>

        <div className="glass rounded-2xl p-6 sm:p-7 flex flex-col">
          <h2 className="font-semibold text-xl" style={{ fontFamily: "var(--font-display)" }}>
            For Investors
          </h2>
          <p className="text-sm text-[var(--muted)] mt-2 flex-1">
            A ranked, evidence-backed pipeline of founders — 3-axis scoring, per-claim trust,
            decision-ready memos.
          </p>
          <div className="mt-5">
            <GoogleSignIn role="investor" label="Continue as Investor" />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-3xl mx-auto mt-16 mb-24 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
        {[
          { n: "01", t: "Apply once", d: "Deck + company name. That's the bar." },
          { n: "02", t: "Scored on 3 axes", d: "Founder · Market · Idea — each independent." },
          { n: "03", t: "24-hour signal", d: "Evidence-backed, confidence-aware." },
        ].map((s) => (
          <div key={s.n} className="glass rounded-2xl p-5">
            <div className="gradient-text font-bold text-sm" style={{ fontFamily: "var(--font-display)" }}>
              {s.n}
            </div>
            <div className="font-semibold mt-1">{s.t}</div>
            <div className="text-xs text-[var(--faint)] mt-1">{s.d}</div>
          </div>
        ))}
      </section>
    </main>
  );
}
