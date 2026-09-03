"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export function LiveSheetPoller() {
  const router = useRouter();
  const lastSyncRef = useRef<number>(Date.now());

  useEffect(() => {
    // Auto-check and sync Google Sheet every 2.5 minutes in the background
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/sync-sheet/live");
        const data = await res.json();
        if (data.success && data.result?.leadsUpdated > 0) {
          router.refresh();
        }
      } catch (err) {
        // Silent background check
      }
    }, 150000); // 2.5 minutes

    return () => clearInterval(interval);
  }, [router]);

  return null;
}
