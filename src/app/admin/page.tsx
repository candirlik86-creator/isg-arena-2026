import { Leaderboard } from "@/components/Leaderboard";
import { ProjectionFrame } from "@/components/ProjectionFrame";
import { QuestionCard } from "@/components/QuestionCard";
import { StageBadge } from "@/components/StageBadge";
import { activeQuestion, demoTeams, leaderboardRevealQuestions, questions } from "@/data/questions";

export default function AdminPage() {
  return (
    <ProjectionFrame eyebrow="Admin Paneli" title="Yarışma Kontrol Merkezi">
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-6">
          <div className="rounded-[2.5rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <StageBadge label="Aktif soru" tone="green" />
                <h2 className="mt-4 text-4xl font-black">Soru {activeQuestion.id}: {activeQuestion.topic}</h2>
                <p className="mt-2 text-lg font-semibold text-slate-300">Toplam {questions.length} soru · Son soru ekstra puanlı değil.</p>
              </div>
              <div className="rounded-3xl bg-slate-950/70 p-5 text-center">
                <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Katılımcı</p>
                <p className="text-5xl font-black text-amber-300">30</p>
                <p className="text-sm font-bold text-slate-300">takım kapasitesi</p>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-4">
              <button className="rounded-2xl bg-amber-300 px-6 py-4 text-lg font-black text-slate-950 shadow-lg shadow-amber-500/20">Sonraki Soru</button>
              <button className="rounded-2xl border border-emerald-300/40 bg-emerald-400/15 px-6 py-4 text-lg font-black text-emerald-100">Lider Tablosu Göster</button>
              <button className="rounded-2xl border border-red-300/40 bg-red-400/15 px-6 py-4 text-lg font-black text-red-100">Acil Duraklat</button>
            </div>
          </div>
          <QuestionCard question={activeQuestion} compact />
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-6">
            <h3 className="text-2xl font-black">Akış göstergesi</h3>
            <div className="mt-5 grid gap-3 sm:grid-cols-5 lg:grid-cols-10">
              {questions.map((question) => {
                const reveals = leaderboardRevealQuestions.includes(question.id as 3 | 6 | 8);
                return (
                  <div key={question.id} className={`rounded-2xl border p-4 text-center ${reveals ? "border-amber-300/50 bg-amber-300/15" : "border-white/10 bg-slate-950/60"}`}>
                    <p className="text-xl font-black">{question.id}</p>
                    <p className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-300">{reveals ? "Tabela" : "Soru"}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
        <Leaderboard teams={demoTeams} title="Demo Takım Listesi" />
      </div>
    </ProjectionFrame>
  );
}
