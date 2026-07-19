"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ScanButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function scan() {
    setLoading(true);
    try {
      await fetch("/api/source", { method: "POST" });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={scan}
      disabled={loading}
      className="rounded-md bg-black text-white text-sm px-4 py-2 disabled:opacity-50"
    >
      {loading ? "Scanning GitHub + HN…" : "Scan for new founders"}
    </button>
  );
}
