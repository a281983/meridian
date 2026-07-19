import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import ApplyForm from "./ApplyForm";

export default async function ApplyPage() {
  const session = await getSession();
  if (!session) redirect("/");
  if (session.role !== "founder") redirect("/dashboard");

  return (
    <main className="mx-auto max-w-xl px-5 py-8 sm:py-10">
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
        Apply for funding
      </h1>
      <p className="text-sm text-[var(--muted)] mt-1 mb-6">
        A confident 24-hour read starts with a deck.
      </p>
      <ApplyForm applicantName={session.name} applicantEmail={session.email} />
    </main>
  );
}
