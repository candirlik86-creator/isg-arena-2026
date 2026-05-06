import { Countdown } from "@/components/Countdown";
import { Leaderboard } from "@/components/Leaderboard";
import { ProjectionFrame } from "@/components/ProjectionFrame";
import { QuestionCard } from "@/components/QuestionCard";
import { activeQuestion, demoTeams } from "@/data/questions";

export default function ScreenPage() {
  return (
    <ProjectionFrame eyebrow="Projeksiyon Ekranı" title="Canlı Yarışma Sahnesi">
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
            <QuestionCard question={activeQuestion} compact />
            <div className="rounded-[2.5rem] border border-amber-300/30 bg-amber-300/10 p-6 text-center shadow-2xl shadow-amber-900/20">
              <p className="text-sm font-black uppercase tracking-[0.3em] text-amber-100">QR Katılım</p>
              <div className="mx-auto mt-6 grid h-48 w-48 grid-cols-5 gap-2 rounded-3xl bg-white p-4">
                {Array.from({ length: 25 }).map((_, index) => <span key={index} className={`rounded ${index % 3 === 0 || index % 7 === 0 ? "bg-slate-950" : "bg-slate-200"}`} />)}
              </div>
              <p className="mt-5 text-xl font-black text-white">/join</p>
              <p className="mt-2 text-sm font-semibold text-slate-300">Takım adı ve 3 kişi ile katıl</p>
            </div>
          </div>
          <Countdown seconds={18} totalSeconds={activeQuestion.timeLimitSeconds} />
        </div>
        <Leaderboard teams={demoTeams} title="Tabela Ön İzleme" limit={3} />
      </div>
    </ProjectionFrame>
  );
}
