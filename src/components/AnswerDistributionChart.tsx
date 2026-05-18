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
    <section className="flex h-full min-h-0 flex-col gap-2 overflow-hidden md:gap-2.5">
      <aside className="grid shrink-0 grid-cols-3 gap-2">
        <div className="rounded-xl border border-white/25 bg-white/[0.15] p-2 shadow-lg shadow-blue-950/20 backdrop-blur md:p-2.5">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-100 md:text-[11px]">Toplam cevap</p>
          <p className="mt-0.5 text-2xl font-black tabular-nums text-white md:text-3xl">{totalAnswers}</p>
          <p className="mt-0.5 truncate text-[11px] font-bold text-blue-50 md:text-xs">
            {totalAnswers === 0 ? "Henüz cevap yok" : `${totalTeams} takımdan`}
          </p>
        </div>

        <div className="rounded-xl border border-cyan-100/35 bg-cyan-300/20 p-2 shadow-lg shadow-blue-950/20 backdrop-blur md:p-2.5">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-100 md:text-[11px]">Katılım oranı</p>
          <p className="mt-0.5 text-2xl font-black tabular-nums text-white md:text-3xl">{participationPercent}%</p>
          <p className="mt-0.5 truncate text-[11px] font-bold text-blue-50 md:text-xs">
            {totalTeams ? `${totalAnswers} / ${totalTeams} takım` : "Takım yok"}
          </p>
        </div>

        <div className="rounded-xl border border-amber-100/35 bg-amber-300/20 p-2 shadow-lg shadow-blue-950/20 backdrop-blur md:p-2.5">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-100 md:text-[11px]">En çok seçilen</p>
          <p className="mt-0.5 text-2xl font-black tabular-nums text-white md:text-3xl">{mostSelectedLabel}</p>
          <p className="mt-0.5 line-clamp-1 text-[11px] font-bold leading-tight text-blue-50 md:text-xs">{mostSelectedText}</p>
        </div>
      </aside>

      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-[clamp(0.85rem,1.5vw,1.25rem)] border border-white/25 bg-white/[0.14] p-2.5 shadow-xl shadow-blue-950/25 backdrop-blur md:p-3">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/60 to-transparent" />
        <div className="relative flex min-h-0 flex-1 flex-col gap-2 overflow-hidden md:gap-2.5">
          <div className="flex shrink-0 items-center justify-between gap-2">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-100 md:text-xs">Sonuç modu</p>
              <h2 className="text-lg font-black text-white md:text-xl lg:text-2xl">Cevap Dağılımı</h2>
            </div>
            <div className="rounded-lg border border-white/20 bg-slate-950/20 px-2.5 py-1.5 text-right shadow-md md:px-3 md:py-2">
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-cyan-100 md:text-[10px]">Dağılım</p>
              <p className="text-lg font-black tabular-nums text-white md:text-xl">{totalAnswers}</p>
            </div>
          </div>

          <div className={`shrink-0 rounded-xl border-[3px] px-3 py-2 shadow-lg md:px-4 md:py-2.5 ${correctStyles.correctBanner}`}>
            <div className="flex items-center gap-2.5 md:gap-3">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-2xl font-black leading-none shadow-lg md:h-11 md:w-11 md:text-3xl ${correctStyles.correctMark}`}
                aria-hidden="true"
              >
                ✓
              </div>
              <div className={`min-w-0 flex-1 ${correctStyles.correctText}`}>
                <p className="text-sm font-black uppercase leading-none tracking-[0.06em] drop-shadow md:text-base lg:text-lg">
                  DOĞRU CEVAP: {question.correctOptionId}
                </p>
                {correctOption ? (
                  <p className="mt-1 line-clamp-2 break-words text-xs font-black leading-snug drop-shadow md:text-sm lg:text-base">
                    {correctOption.text}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          {totalAnswers === 0 ? (
            <div className="shrink-0 rounded-lg border border-amber-200/25 bg-amber-300/10 px-3 py-2 text-sm font-black text-amber-100 md:text-base">
              Henüz cevap yok
            </div>
          ) : null}

          <div className="grid min-h-0 flex-1 grid-rows-4 gap-1.5 overflow-hidden md:gap-2">
            {question.options.map((option) => {
              const count = counts[option.id];
              const percent = totalAnswers ? (count / totalAnswers) * 100 : 0;
              const barWidth = totalAnswers ? percent : 0;
              const isCorrect = option.id === question.correctOptionId;
              const styles = optionStyles[option.id];

              return (
                <article
                  key={option.id}
                  className={`relative flex min-h-0 overflow-hidden rounded-lg border ${
                    isCorrect
                      ? `${styles.correctRow} shadow-lg ring-2 md:ring-[3px]`
                      : `${styles.muted} bg-slate-950/[0.18] opacity-75 shadow-md`
                  }`}
                >
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/45 to-transparent" />
                  <div className="relative grid h-full min-h-0 w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 px-2 py-1.5 md:gap-2.5 md:px-3 md:py-2">
                    <div
                      className={`flex shrink-0 items-center justify-center rounded-lg border font-black shadow-md ${
                        isCorrect ? `h-9 w-9 border-white text-lg ${styles.badge}` : `h-8 w-8 text-base ${styles.badge}`
                      }`}
                    >
                      {option.id}
                    </div>

                    <div className="min-w-0">
                      <div className="flex min-w-0 items-center gap-1.5 md:gap-2">
                        <p
                          className={`min-w-0 truncate font-black leading-tight ${
                            isCorrect ? `${styles.correctText} text-sm drop-shadow md:text-base` : "text-xs text-white md:text-sm"
                          }`}
                        >
                          {option.text}
                        </p>
                        {isCorrect ? (
                          <span className="hidden shrink-0 rounded-full border border-white bg-white px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] text-slate-950 shadow-md sm:inline-flex md:text-[10px]">
                            ✓ DOĞRU
                          </span>
                        ) : (
                          <span className="hidden shrink-0 rounded-full border border-white/15 bg-slate-950/20 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] text-slate-300 sm:inline-flex">
                            ×
                          </span>
                        )}
                      </div>
                      <div
                        className={`mt-1 overflow-hidden rounded-full border shadow-inner ${
                          isCorrect ? "h-2 border-white/50 bg-white/40 md:h-2.5" : "h-1.5 border-white/10 bg-white/15"
                        }`}
                      >
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${
                            isCorrect ? styles.correctBar : styles.accent
                          } ${isCorrect ? "shadow-md" : "opacity-50"} transition-[width] duration-500`}
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5 md:gap-2">
                      <div
                        className={`min-w-[2.75rem] rounded-md border px-1.5 py-1 text-center md:min-w-[3rem] md:px-2 ${
                          isCorrect ? "border-white/45 bg-slate-950/[0.22]" : "border-white/10 bg-slate-950/[0.16]"
                        }`}
                      >
                        <p className={`font-black uppercase tracking-[0.14em] ${isCorrect ? "text-[8px] text-white md:text-[9px]" : "text-[8px] text-cyan-100"}`}>
                          Cevap
                        </p>
                        <p className={`font-black tabular-nums text-white ${isCorrect ? "text-base md:text-lg" : "text-sm md:text-base"}`}>{count}</p>
                      </div>
                      <div
                        className={`min-w-[2.75rem] rounded-md border px-1.5 py-1 text-center md:min-w-[3rem] md:px-2 ${
                          isCorrect ? "border-white/45 bg-slate-950/[0.22]" : "border-white/10 bg-slate-950/[0.16]"
                        }`}
                      >
                        <p className={`font-black uppercase tracking-[0.14em] ${isCorrect ? "text-[8px] text-white md:text-[9px]" : "text-[8px] text-cyan-100"}`}>
                          Oran
                        </p>
                        <p className={`font-black tabular-nums text-white ${isCorrect ? "text-base md:text-lg" : "text-sm md:text-base"}`}>
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
