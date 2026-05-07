import type { Team } from "@/data/questions";
import { TeamCard } from "./TeamCard";

type LeaderboardProps = {
  teams: Team[];
  title?: string;
  limit?: number;
};

export function Leaderboard({ teams, title = "Lider Tablosu", limit = 5 }: LeaderboardProps) {
  const rankedTeams = [...teams].sort((a, b) => b.score - a.score).slice(0, limit);

  return (
    <section className="rounded-[2.5rem] border border-white/10 bg-slate-950/75 p-6 shadow-2xl shadow-black/30 backdrop-blur md:p-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-emerald-200">Canlı sıralama</p>
          <h2 className="mt-2 text-3xl font-black text-white md:text-5xl">{title}</h2>
        </div>
        <div className="rounded-2xl border border-amber-300/30 bg-amber-300/10 px-4 py-3 text-right text-sm font-bold text-amber-100">Maks. 1000 puan<br />her soru</div>
      </div>
      <div className="space-y-4">
        {rankedTeams.map((team, index) => <TeamCard key={team.id} team={team} rank={index + 1} />)}
      </div>
    </section>
  );
}
