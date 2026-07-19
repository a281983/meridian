// Demo session — a signed-ish cookie holding {name, email, role}. Deliberately
// lightweight (no real OAuth) so the app runs with zero setup. The read/write
// boundary lives here, so swapping in Auth.js later touches only this file plus
// the sign-in component.
import { cookies } from "next/headers";

export const SESSION_COOKIE = "meridian_session";

export async function getSession() {
  const store = await cookies();
  const raw = store.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(Buffer.from(raw, "base64").toString("utf8"));
  } catch {
    return null;
  }
}

export function encodeSession(session) {
  return Buffer.from(JSON.stringify(session), "utf8").toString("base64");
}
