import { getQuizAnswerDistribution, type AnswerId, type GameState, type QuizFlowItem } from "@/lib/game-state";

type AnswerDistributionChartProps = {
  state: GameState;
  question: QuizFlowItem;
};

const optionStyles: Record<
  AnswerId,
  {
    accent: string;
    badge: string;
    muted: string;
    correctBanner: string;
    correctRow: string;
    correctBar: string;
    correctText: string;
    correctMark: string;
  }
> = {
  A: {
    accent: "from-amber-300 to-yellow-500",
    badge: "border-amber-200/50 bg-amber-300 text-slate-950 shadow-amber-300/30",
    muted: "border-amber-200/25 bg-amber-300/10 text-amber-100",
    correctBanner: "border-white bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 shadow-amber-300/35",
    correctRow: "border-white bg-gradient-to-r from-amber-300/95 via-yellow-400/45 to-white/[0.18] shadow-amber-300/35 ring-white/75",
    correctBar: "from-amber-200 via-yellow-300 to-amber-500 shadow-amber-200/50",
    correctText: "text-slate-950",
    correctMark: "bg-slate-950 text-amber-200",
  },
  B: {
    accent: "from-sky-300 to-blue-500",
    badge: "border-sky-200/50 bg-sky-300 text-slate-950 shadow-sky-300/30",
    muted: "border-sky-200/25 bg-sky-300/10 text-sky-100",
    correctBanner: "border-white bg-gradient-to-r from-sky-300 via-blue-500 to-indigo-600 shadow-sky-300/35",
    correctRow: "border-white bg-gradient-to-r from-sky-300/90 via-blue-500/55 to-white/[0.18] shadow-sky-300/35 ring-white/75",
    correctBar: "from-sky-200 via-blue-400 to-indigo-500 shadow-sky-200/50",
    correctText: "text-white",
    correctMark: "bg-white text-blue-700",
  },
  C: {
    accent: "from-cyan-300 to-teal-500",
    badge: "border-cyan-200/50 bg-cyan-300 text-slate-950 shadow-cyan-300/30",
    muted: "border-cyan-200/25 bg-cyan-300/10 text-cyan-100",
    correctBanner: "border-white bg-gradient-to-r from-cyan-300 via-teal-400 to-cyan-500 shadow-cyan-300/35",
    correctRow: "border-white bg-gradient-to-r from-cyan-300/90 via-teal-400/50 to-white/[0.18] shadow-cyan-300/35 ring-white/75",
    correctBar: "from-cyan-100 via-teal-300 to-cyan-500 shadow-cyan-200/50",
    correctText: "text-slate-950",
    correctMark: "bg-slate-950 text-cyan-200",
  },
  D: {
    accent: "from-rose-300 to-red-500",
    badge: "border-rose-200/50 bg-rose-300 text-slate-950 shadow-rose-300/30",
    muted: "border-rose-200/25 bg-rose-300/10 text-rose-100",
    correctBanner: "border-white bg-gradient-to-r from-rose-300 via-red-500 to-pink-600 shadow-rose-300/35",
    correctRow: "border-white bg-gradient-to-r from-rose-300/90 via-red-500/55 to-white/[0.18] shadow-rose-300/35 ring-white/75",
    correctBar: "from-rose-200 via-red-400 to-pink-500 shadow-rose-200/50",
    correctText: "text-white",
    correctMark: "bg-white text-red-700",
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
  const correctStyles = optionStyles[question.correctOptionId];

  return (
    <section className="grid gap-6 xl:grid-cols-[360px_1fr]">
      <aside className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
        <div className="rounded-[1.75rem] border border-white/25 bg-white/[0.15] p-6 shadow-2xl shadow-blue-950/20 backdrop-blur">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-100">Toplam cevap</p>
          <p className="mt-3 text-7xl font-black tabular-nums text-white">{totalAnswers}</p>
          <p className="mt-2 text-xl font-bold text-blue-50">{totalAnswers === 0 ? "Henüz cevap yok" : `${totalTeams} takımdan`}</p>
        </div>

        <div className="rounded-[1.75rem] border border-cyan-100/35 bg-cyan-300/20 p-6 shadow-2xl shadow-blue-950/20 backdrop-blur">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-100">Katılım oranı</p>
          <p className="mt-3 text-7xl font-black tabular-nums text-white">{participationPercent}%</p>
          <p className="mt-2 text-xl font-bold text-blue-50">
            {totalTeams ? `${totalAnswers} / ${totalTeams} takım` : "Takım yok"}
          </p>
        </div>

        <div className="rounded-[1.75rem] border border-amber-100/35 bg-amber-300/20 p-6 shadow-2xl shadow-blue-950/20 backdrop-blur">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-amber-100">En çok seçilen</p>
          <p className="mt-3 text-7xl font-black tabular-nums text-white">{mostSelectedLabel}</p>
          <p className="mt-2 line-clamp-2 text-xl font-bold leading-tight text-blue-50">{mostSelectedText}</p>
        </div>
      </aside>

      <div className="relative overflow-hidden rounded-[2rem] border border-white/25 bg-white/[0.14] p-6 shadow-2xl shadow-blue-950/25 backdrop-blur md:p-8">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/60 to-transparent" />
        <div className="relative">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.32em] text-cyan-100">Sonuç modu</p>
              <h2 className="mt-2 text-4xl font-black text-white md:text-6xl">Cevap Dağılımı</h2>
            </div>
            <div className="rounded-2xl border border-white/20 bg-slate-950/20 px-5 py-4 text-right shadow-xl shadow-blue-900/15">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-100">Dağılım</p>
              <p className="mt-1 text-3xl font-black tabular-nums text-white md:text-4xl">{totalAnswers}</p>
            </div>
          </div>

          <div className={`mt-6 rounded-[1.75rem] border-4 px-5 py-5 shadow-2xl md:px-7 md:py-6 ${correctStyles.correctBanner}`}>
            <div className="flex flex-wrap items-center justify-center gap-5 text-center md:flex-nowrap">
              <div
                className={`flex h-24 w-24 shrink-0 items-center justify-center rounded-[1.35rem] text-7xl font-black leading-none shadow-2xl md:h-28 md:w-28 md:text-8xl ${correctStyles.correctMark}`}
                aria-hidden="true"
              >
                ✓
              </div>
              <div className={`min-w-0 ${correctStyles.correctText}`}>
                <p className="text-4xl font-black uppercase leading-none tracking-[0.08em] drop-shadow md:text-6xl">
                  DOĞRU CEVAP: {question.correctOptionId}
                </p>
                {correctOption ? (
                  <p className="mx-auto mt-3 max-w-4xl break-words text-2xl font-black leading-tight drop-shadow md:text-4xl">
                    {correctOption.text}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          {totalAnswers === 0 ? (
            <div className="mt-5 rounded-2xl border border-amber-200/25 bg-amber-300/10 px-5 py-4 text-2xl font-black text-amber-100">
              Henüz cevap yok
            </div>
          ) : null}

          <div className="mt-7 grid gap-4">
            {question.options.map((option) => {
              const count = counts[option.id];
              const percent = totalAnswers ? (count / totalAnswers) * 100 : 0;
              const barWidth = totalAnswers ? percent : 0;
              const isCorrect = option.id === question.correctOptionId;
              const styles = optionStyles[option.id];

              return (
                <article
                  key={option.id}
                  className={`relative overflow-hidden rounded-[1.5rem] border transition ${
                    isCorrect
                      ? `${styles.correctRow} p-6 shadow-2xl ring-4 md:p-7`
                      : `${styles.muted} bg-slate-950/[0.18] p-4 opacity-70 shadow-lg shadow-blue-950/10`
                  }`}
                >
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/45 to-transparent" />
                  <div className={`relative grid gap-5 md:items-center ${isCorrect ? "md:grid-cols-[minmax(0,1fr)_330px]" : "md:grid-cols-[minmax(0,1fr)_280px]"}`}>
                    <div className={`flex min-w-0 items-center ${isCorrect ? "gap-5" : "gap-4"}`}>
                      <div
                        className={`flex shrink-0 items-center justify-center rounded-2xl border font-black shadow-xl ${
                          isCorrect ? `h-24 w-24 border-white text-5xl ${styles.badge}` : `h-16 w-16 text-3xl ${styles.badge}`
                        }`}
                      >
                        {option.id}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                          <p
                            className={`break-words font-black leading-tight ${
                              isCorrect ? `${styles.correctText} text-4xl drop-shadow-lg md:text-5xl` : "text-2xl text-white md:text-3xl"
                            }`}
                          >
                            {option.text}
                          </p>
                          {isCorrect ? (
                            <span className="inline-flex items-center rounded-full border-2 border-white bg-white px-4 py-2 text-base font-black uppercase tracking-[0.14em] text-slate-950 shadow-xl shadow-blue-950/15 md:text-lg">
                              ✓ DOĞRU CEVAP
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full border border-white/15 bg-slate-950/20 px-3 py-1 text-sm font-black uppercase tracking-[0.16em] text-slate-300">
                              × Yanlış
                            </span>
                          )}
                        </div>
                        <div
                          className={`mt-5 overflow-hidden rounded-full border shadow-inner ${
                            isCorrect ? "h-10 border-white/50 bg-white/40" : "h-6 border-white/10 bg-white/15"
                          }`}
                        >
                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${
                              isCorrect ? styles.correctBar : styles.accent
                            } ${isCorrect ? "shadow-lg" : "opacity-50"} transition-[width] duration-500`}
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div
                        className={`min-w-0 rounded-2xl border px-4 text-center ${
                          isCorrect ? "border-white/45 bg-slate-950/[0.22] py-5" : "border-white/10 bg-slate-950/[0.16] py-3"
                        }`}
                      >
                        <p className={`font-black uppercase tracking-[0.22em] ${isCorrect ? "text-sm text-white" : "text-xs text-cyan-100"}`}>Cevap</p>
                        <p className={`mt-2 font-black tabular-nums text-white ${isCorrect ? "text-5xl lg:text-6xl" : "text-3xl lg:text-4xl"}`}>
                          {count}
                        </p>
                      </div>
                      <div
                        className={`min-w-0 rounded-2xl border px-4 text-center ${
                          isCorrect ? "border-white/45 bg-slate-950/[0.22] py-5" : "border-white/10 bg-slate-950/[0.16] py-3"
                        }`}
                      >
                        <p className={`font-black uppercase tracking-[0.22em] ${isCorrect ? "text-sm text-white" : "text-xs text-cyan-100"}`}>Oran</p>
                        <p className={`mt-2 font-black tabular-nums text-white ${isCorrect ? "text-5xl lg:text-6xl" : "text-3xl lg:text-4xl"}`}>
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
