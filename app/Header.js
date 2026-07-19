import { getSession } from "@/lib/session";
import Brand from "./Brand";
import SignOut from "./SignOut";

export default async function Header() {
  const session = await getSession();

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[rgba(6,9,19,0.7)] backdrop-blur-xl">
      <div className="mx-auto max-w-6xl px-5 h-16 flex items-center justify-between">
        <a href={session ? (session.role === "investor" ? "/dashboard" : "/founder") : "/"} className="flex items-center gap-2.5">
          <Brand />
          <span className="font-semibold text-lg tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
            Meridian
          </span>
        </a>

        {session && (
          <div className="flex items-center gap-5">
            {session.role === "founder" && (
              <a href="/apply" className="text-sm text-[var(--muted)] hover:text-[var(--text)] transition hidden sm:block">
                Apply
              </a>
            )}
            <span className="hidden sm:flex items-center gap-2 text-sm text-[var(--muted)]">
              <span
                className="h-7 w-7 rounded-full grid place-items-center text-xs font-semibold text-[#060913]"
                style={{ background: "var(--grad)" }}
              >
                {session.name.split(" ").map((w) => w[0]).join("")}
              </span>
              <span className="capitalize">{session.role}</span>
            </span>
            <SignOut />
          </div>
        )}
      </div>
    </header>
  );
}
