"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ActivateButton({ id }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function activate() {
    setLoading(true);
    try {
      await fetch(`/api/activate/${id}`, { method: "POST" });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={activate}
      disabled={loading}
      className="rounded-md bg-black text-white text-sm px-4 py-2 disabled:opacity-50"
    >
      {loading ? "Drafting outreach…" : "Activate — draft outreach"}
    </button>
  );
}
