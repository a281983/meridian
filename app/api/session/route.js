import { NextResponse } from "next/server";
import { SESSION_COOKIE, encodeSession } from "@/lib/session";

// POST { role, name?, email? } → set the demo session cookie.
export async function POST(req) {
  const { role, name, email } = await req.json();
  if (!["founder", "investor"].includes(role)) {
    return NextResponse.json({ error: "invalid role" }, { status: 400 });
  }

  const session = {
    role,
    name: name || (role === "investor" ? "Dana Alvarez" : "Alex Rivera"),
    email: email || (role === "investor" ? "dana@meridian.vc" : "alex@demo.com"),
  };

  const res = NextResponse.json({ session });
  res.cookies.set(SESSION_COOKIE, encodeSession(session), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}

// DELETE → sign out.
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
