import { ProjectionFrame } from "@/components/ProjectionFrame";
import { demoTeams } from "@/data/questions";

const prizes = ["30.000 TL", "24.000 TL", "18.000 TL"];
const medals = ["Şampiyon", "İkinci", "Üçüncü"];

export default function ResultsPage() {
  const winners = [...demoTeams].sort((a, b) => b.score - a.score).slice(0, 3);

  return (
    <ProjectionFrame eyebrow="Final Sonuçları" title="İSG Arena 2026 Kazananları">
      <div className="grid min-h-[68vh] items-end gap-6 lg:grid-cols-3">
        {winners.map((team, index) => (
          <article key={team.id} className={`rounded-[3rem] border p-8 text-center shadow-2xl ${index === 0 ? "order-first border-amber-300/50 bg-amber-300/15 lg:-translate-y-10" : "border-white/10 bg-white/[0.06]"}`}>
            <p className="text-sm font-black uppercase tracking-[0.32em] text-amber-200">{medals[index]}</p>
            <div className="mx-auto mt-6 flex h-24 w-24 items-center justify-center rounded-[2rem] bg-amber-300 text-5xl font-black text-slate-950">{index + 1}</div>
            <h2 className="mt-6 text-4xl font-black text-white">{team.name}</h2>
            <p className="mt-2 text-lg font-semibold text-slate-300">{team.depot} · {team.members.join(", ")}</p>
            <p className="mt-8 text-5xl font-black text-amber-200">{prizes[index]}</p>
            <p className="mt-3 rounded-2xl border border-emerald-300/30 bg-emerald-400/10 px-4 py-3 text-lg font-bold text-emerald-100">Kişi başı {(parseInt(prizes[index].replace(/\D/g, ""), 10) / 3).toLocaleString("tr-TR")} TL</p>
            <p className="mt-5 text-2xl font-black tabular-nums text-white">{team.score.toLocaleString("tr-TR")} puan</p>
          </article>
        ))}
      </div>
    </ProjectionFrame>
  );
}
