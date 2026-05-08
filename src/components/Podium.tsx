import { formatPrize, type GameSettings, type LeaderboardEntry } from "@/lib/game-state";

type PodiumProps = {
  teams: LeaderboardEntry[];
  settings: GameSettings;
};

const medals = ["Şampiyon", "İkinci", "Üçüncü"];

export function Podium({ teams, settings }: PodiumProps) {
  const prizes = [settings.prizeFirst, settings.prizeSecond, settings.prizeThird];
  const winners = teams.slice(0, 3);

  if (!winners.length) {
    return (
      <div className="rounded-[2.5rem] border border-white/10 bg-white/[0.06] p-10 text-center shadow-2xl">
        <p className="text-3xl font-black text-white">Henüz sonuç yok.</p>
      </div>
    );
  }

  return (
    <div className="grid min-h-[62vh] items-end gap-6 lg:grid-cols-3">
      {winners.map((team, index) => (
        <article
          key={team.id}
          className={`rounded-[3rem] border p-8 text-center shadow-2xl ${
            index === 0 ? "order-first border-amber-300/50 bg-amber-300/15 lg:-translate-y-10" : "border-white/10 bg-white/[0.06]"
          }`}
        >
          <p className="text-sm font-black uppercase tracking-[0.32em] text-amber-200">{medals[index]}</p>
          <div className="mx-auto mt-6 flex h-24 w-24 items-center justify-center rounded-[2rem] bg-amber-300 text-5xl font-black text-slate-950">{index + 1}</div>
          <h2 className="mt-6 text-4xl font-black text-white">{team.name}</h2>
          <p className="mt-3 text-lg font-semibold text-slate-300">
            {team.correctAnswers} doğru · Forklift {team.forkliftScore.toLocaleString("tr-TR")} puan
          </p>
          <p className="mt-8 text-5xl font-black text-amber-200">{formatPrize(prizes[index], settings.currency)}</p>
          <p className="mt-3 rounded-2xl border border-emerald-300/30 bg-emerald-400/10 px-4 py-3 text-lg font-bold text-emerald-100">
            Kişi başı {formatPrize(Math.round(prizes[index] / settings.teamSize), settings.currency)}
          </p>
          <p className="mt-5 text-2xl font-black tabular-nums text-white">{team.score.toLocaleString("tr-TR")} puan</p>
        </article>
      ))}
    </div>
  );
}
