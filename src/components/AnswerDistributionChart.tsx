import { getQuizAnswerDistribution, type AnswerId, type GameState, type QuizFlowItem } from "@/lib/game-state";

type AnswerDistributionChartProps = {
  state: GameState;
  question: QuizFlowItem;
};

const optionStyles: Record<AnswerId, { accent: string; badge: string; muted: string }> = {
  A: {
    accent: "from-amber-300 to-yellow-500",
    badge: "border-amber-200/50 bg-amber-300 text-slate-950 shadow-amber-300/30",
    muted: "border-red-300/25 bg-red-500/10 text-red-100",
  },
  B: {
    accent: "from-sky-300 to-blue-500",
    badge: "border-sky-200/50 bg-sky-300 text-slate-950 shadow-sky-300/30",
    muted: "border-red-300/25 bg-red-500/10 text-red-100",
  },
  C: {
    accent: "from-cyan-300 to-teal-500",
    badge: "border-cyan-200/50 bg-cyan-300 text-slate-950 shadow-cyan-300/30",
    muted: "border-red-300/25 bg-red-500/10 text-red-100",
  },
  D: {
    accent: "from-rose-300 to-red-500",
    badge: "border-rose-200/50 bg-rose-300 text-slate-950 shadow-rose-300/30",
    muted: "border-red-300/25 bg-red-500/10 text-red-100",
  },
};

function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

export function AnswerDistributionChart({ state, question }: AnswerDistributionChartProps) {
  const { counts, totalAnswers } = getQuizAnswerDistribution(state, question);
  const totalTeams = state.teams.length;
  const participationPercent = totalTeams ? Math.round((totalAnswers / totalTeams) * 100) : 0;
  const topCount = Math.max(...question.options.map((option) => counts[option.id]));
  const mostSelectedOptions = topCount > 0 ? question.options.filter((option) => counts[option.id] === topCount) : [];
  const mostSelectedLabel = mostSelectedOptions.length ? mostSelectedOptions.map((option) => option.id).join(" / ") : "-";
  const mostSelectedText = mostSelectedOptions.length === 1 ? mostSelectedOptions[0].text : topCount > 0 ? "Berabere" : "Henüz cevap yok";
  const correctOption = question.options.find((option) => option.id === question.correctOptionId);

  return (
    <section className="grid gap-5 xl:grid-cols-[310px_1fr]">
      <aside className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
        <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 shadow-2xl shadow-black/25">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">Toplam cevap</p>
          <p className="mt-3 text-6xl font-black tabular-nums text-white">{totalAnswers}</p>
          <p className="mt-2 text-lg font-bold text-slate-300">{totalAnswers === 0 ? "Henüz cevap yok" : `${totalTeams} takımdan`}</p>
        </div>

        <div className="rounded-3xl border border-cyan-200/20 bg-cyan-300/10 p-5 shadow-2xl shadow-cyan-950/20">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-100">Katılım oranı</p>
          <p className="mt-3 text-6xl font-black tabular-nums text-white">{participationPercent}%</p>
          <p className="mt-2 text-lg font-bold text-slate-300">
            {totalTeams ? `${totalAnswers} / ${totalTeams} takım` : "Takım yok"}
          </p>
        </div>

        <div className="rounded-3xl border border-amber-200/20 bg-amber-300/10 p-5 shadow-2xl shadow-amber-950/20">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-amber-100">En çok seçilen</p>
          <p className="mt-3 text-6xl font-black tabular-nums text-white">{mostSelectedLabel}</p>
          <p className="mt-2 line-clamp-2 text-lg font-bold leading-tight text-slate-200">{mostSelectedText}</p>
        </div>
      </aside>

      <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(15,23,42,0.96),rgba(2,6,23,0.9))] p-5 shadow-2xl shadow-black/40 md:p-7">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/60 to-transparent" />
        <div className="absolute right-0 top-0 h-44 w-44 bg-emerald-300/10 blur-3xl" />
        <div className="relative">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.32em] text-cyan-100">Sonuç modu</p>
              <h2 className="mt-2 text-4xl font-black text-white md:text-6xl">Cevap Dağılımı</h2>
            </div>
            <div className="rounded-2xl border border-emerald-200/35 bg-emerald-300/10 px-5 py-4 text-right shadow-xl shadow-emerald-950/30">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-100">Doğru cevap</p>
              <p className="mt-1 text-3xl font-black text-white">
                {question.correctOptionId}
                {correctOption ? ` - ${correctOption.text}` : ""}
              </p>
            </div>
          </div>

          {totalAnswers === 0 ? (
            <div className="mt-5 rounded-2xl border border-amber-200/25 bg-amber-300/10 px-5 py-4 text-2xl font-black text-amber-100">
              Henüz cevap yok
            </div>
          ) : null}

          <div className="mt-6 grid gap-4">
            {question.options.map((option) => {
              const count = counts[option.id];
              const percent = totalAnswers ? (count / totalAnswers) * 100 : 0;
              const barWidth = totalAnswers ? percent : 0;
              const isCorrect = option.id === question.correctOptionId;
              const styles = optionStyles[option.id];

              return (
                <article
                  key={option.id}
                  className={`relative overflow-hidden rounded-[1.5rem] border p-4 transition ${
                    isCorrect
                      ? "border-emerald-200/80 bg-emerald-400/15 shadow-2xl shadow-emerald-500/20 ring-2 ring-emerald-300/25"
                      : styles.muted
                  }`}
                >
                  <div className="relative grid gap-4 md:grid-cols-[minmax(0,1fr)_170px] md:items-center">
                    <div className="flex min-w-0 items-center gap-4">
                      <div
                        className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border text-3xl font-black shadow-xl ${
                          isCorrect ? "border-emerald-100 bg-emerald-300 text-slate-950 shadow-emerald-300/30" : styles.badge
                        }`}
                      >
                        {option.id}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                          <p className="text-2xl font-black leading-tight text-white md:text-3xl">{option.text}</p>
                          {isCorrect ? (
                            <span className="inline-flex items-center rounded-full border border-emerald-100/50 bg-emerald-300 px-3 py-1 text-sm font-black uppercase tracking-[0.18em] text-slate-950 shadow-lg shadow-emerald-300/20">
                              ✓ Doğru
                            </span>
                          ) : null}
                        </div>
                        <div className="mt-4 h-7 overflow-hidden rounded-full border border-white/10 bg-slate-950/80 shadow-inner">
                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${
                              isCorrect ? "from-emerald-200 via-emerald-300 to-green-400" : styles.accent
                            } shadow-lg transition-[width] duration-500`}
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-slate-950/55 px-5 py-4 md:justify-end md:text-right">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">Cevap</p>
                        <p className="text-5xl font-black tabular-nums text-white">{count}</p>
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">Oran</p>
                        <p className={`text-5xl font-black tabular-nums ${isCorrect ? "text-emerald-100" : "text-red-100"}`}>
                          {formatPercent(percent)}
                        </p>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
