import type { Team } from "@/data/questions";

type TeamCardProps = {
  team: Team;
  rank?: number;
};

const trendLabel = { up: "▲ yükselişte", same: "● stabil", down: "▼ takipte" };

export function TeamCard({ team, rank }: TeamCardProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 shadow-xl shadow-black/20">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {rank ? <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-300 text-xl font-black text-slate-950">{rank}</div> : null}
          <div>
            <h3 className="text-xl font-black text-white">{team.name}</h3>
            <p className="text-sm font-semibold text-slate-400">{team.depot} · {team.members.join(", ")}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black tabular-nums text-amber-200">{team.score.toLocaleString("tr-TR")}</p>
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-200">{trendLabel[team.trend]}</p>
        </div>
      </div>
    </div>
  );
}
