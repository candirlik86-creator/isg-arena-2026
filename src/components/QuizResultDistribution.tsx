import { getQuizAnswerDistribution, type GameState, type QuizFlowItem } from "@/lib/game-state";

type QuizResultDistributionProps = {
  state: GameState;
  question: QuizFlowItem;
};

const optionTone = {
  A: "from-amber-400 to-yellow-600",
  B: "from-sky-400 to-blue-600",
  C: "from-emerald-400 to-green-600",
  D: "from-red-400 to-rose-600",
};

export function QuizResultDistribution({ state, question }: QuizResultDistributionProps) {
  const { counts, totalAnswers } = getQuizAnswerDistribution(state, question);
  const maxCount = Math.max(1, ...Object.values(counts));

  return (
    <section className="rounded-[2.5rem] border border-white/10 bg-slate-950/80 p-6 shadow-2xl shadow-black/30">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.3em] text-emerald-200">Quiz sonuç modu</p>
          <h2 className="mt-2 text-4xl font-black text-white">Cevap Dağılımı</h2>
        </div>
        <div className="rounded-2xl border border-amber-300/30 bg-amber-300/10 px-5 py-4 text-center">
          <p className="text-xs font-black uppercase tracking-widest text-amber-200">Toplam cevap</p>
          <p className="text-4xl font-black text-white">{totalAnswers}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4">
        {question.options.map((option) => {
          const count = counts[option.id];
          const percent = totalAnswers ? Math.round((count / totalAnswers) * 100) : 0;
          const barWidth = Math.max(4, (count / maxCount) * 100);
          const isCorrect = option.id === question.correctOptionId;

          return (
            <article
              key={option.id}
              className={`rounded-2xl border p-4 ${
                isCorrect ? "border-emerald-300/60 bg-emerald-400/15" : "border-red-300/30 bg-red-400/10"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-4">
                  <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${optionTone[option.id]} text-2xl font-black text-slate-950`}>
                    {option.id}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xl font-black leading-tight text-white">{option.text}</p>
                    <p className={`mt-2 text-sm font-black uppercase tracking-widest ${isCorrect ? "text-emerald-200" : "text-red-200"}`}>
                      {isCorrect ? "✓ Doğru cevap" : "× Yanlış cevap"}
                    </p>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-4xl font-black tabular-nums text-white">{count}</p>
                  <p className="text-sm font-bold text-slate-300">{percent}%</p>
                </div>
              </div>
              <div className="mt-4 h-5 overflow-hidden rounded-full bg-slate-800">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${isCorrect ? "from-emerald-300 to-emerald-500" : "from-red-300 to-red-500"}`}
                  style={{ width: `${barWidth}%` }}
                />
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
