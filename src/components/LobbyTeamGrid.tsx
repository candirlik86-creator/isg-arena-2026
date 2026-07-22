"use client";

import { useEffect, useRef } from "react";

type LobbyTeam = { id: string; name: string };

/**
 * Lobi takım ızgarası — otomatik sığdırma.
 * Izgara taşana kadar font boyutunu (dolayısıyla em-tabanlı pill'leri) küçültür,
 * böylece her takım sayısında (1–50) hiçbir takım kırpılmaz ve isimler mümkün
 * olan en büyük okunur boyutta kalır.
 */
export function LobbyTeamGrid({ teams }: { teams: LobbyTeam[] }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const grid = ref.current;
    if (!grid) return;

    const fit = () => {
      const MAX = 30;
      const MIN = 10;
      let size = MAX;
      grid.style.fontSize = `${size}px`;
      let guard = 0;
      while (size > MIN && grid.scrollHeight > grid.clientHeight + 1 && guard++ < 40) {
        size -= 1;
        grid.style.fontSize = `${size}px`;
      }
    };
    const run = () => window.requestAnimationFrame(fit);

    run();
    const observer = new ResizeObserver(run);
    observer.observe(grid);
    window.addEventListener("resize", run);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", run);
    };
  }, [teams.length]);

  return (
    <div
      ref={ref}
      className="mt-3 grid min-h-0 flex-1 content-center gap-[0.5em] overflow-hidden md:mt-4"
      style={{ fontSize: "22px", gridTemplateColumns: "repeat(auto-fill, minmax(7.5em, 1fr))" }}
    >
      {teams.length ? (
        teams.map((team, index) => (
          <div
            key={team.id}
            className="flex items-center gap-[0.55em] rounded-[0.5em] border border-white/15 bg-gradient-to-br from-white/[0.16] to-white/[0.055] px-[0.62em] py-[0.42em] shadow-lg shadow-blue-950/20"
            style={{ borderTopColor: "rgba(255,255,255,0.28)" }}
          >
            <span
              className="flex shrink-0 items-center justify-center rounded-[0.35em] bg-gradient-to-br from-amber-200 to-amber-400 font-black tabular-nums text-slate-950 shadow"
              style={{ width: "1.55em", height: "1.55em" }}
            >
              <span style={{ fontSize: "0.8em" }}>{index + 1}</span>
            </span>
            <span className="min-w-0 flex-1 truncate font-black text-white" style={{ fontSize: "1em" }}>
              {team.name}
            </span>
          </div>
        ))
      ) : (
        <p
          className="rounded-2xl border border-white/20 bg-white/[0.10] p-6 text-center text-lg font-bold text-slate-200"
          style={{ gridColumn: "1 / -1", fontSize: "18px" }}
        >
          Takımlar PIN ile bağlanmayı bekliyor.
        </p>
      )}
    </div>
  );
}
