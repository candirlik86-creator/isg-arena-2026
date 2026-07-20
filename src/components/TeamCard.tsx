import type { LeaderboardEntry } from "@/lib/game-state";

type TeamCardProps = {
  team: LeaderboardEntry;
  rank?: number;
};

export function TeamCard({ team, rank }: TeamCardProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 shadow-xl shadow-black/20">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          {rank ? <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-300 text-xl font-black text-slate-950">{rank}</div> : null}
          <div className="min-w-0">
            <h3 className="truncate text-xl font-black text-white">{team.name}</h3>
            <p className="truncate text-sm font-semibold text-slate-400">
              {team.correctAnswers} doğru · {team.wrongAnswers} yanlış · Forklift {team.forkliftScore.toLocaleString("tr-TR")}
            </p>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-2xl font-black tabular-nums text-amber-200">{team.score.toLocaleString("tr-TR")}</p>
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-200">puan</p>
        </div>
      </div>
    </div>
  );
}
