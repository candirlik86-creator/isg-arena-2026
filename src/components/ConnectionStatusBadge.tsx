"use client";

import { useSyncExternalStore } from "react";
import { getConnectionLost, subscribeConnectionStatus } from "@/lib/game-store";

export function ConnectionStatusBadge() {
  const connectionLost = useSyncExternalStore(
    subscribeConnectionStatus,
    getConnectionLost,
    () => false,
  );

  if (!connectionLost) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[100] flex justify-center p-2">
      <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-amber-200/60 bg-amber-400/95 px-4 py-2 text-sm font-black text-slate-950 shadow-2xl shadow-black/30 backdrop-blur">
        <span className="inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-red-600" />
        Bağlantı yeniden kuruluyor…
      </div>
    </div>
  );
}
