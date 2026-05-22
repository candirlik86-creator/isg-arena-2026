import { getQuizAnswerDistribution, type AnswerId, type GameState, type QuizFlowItem } from "@/lib/game-state";

type AnswerDistributionChartProps = {
  state: GameState;
  question: QuizFlowItem;
};

const optionStyles: Record<
  AnswerId,
  {
    card: string;
    badge: string;
    correctText: string;
    glow: string;
  }
> = {
  A: {
    card: "border-amber-100 bg-gradient-to-br from-amber-300 via-orange-400 to-yellow-500 shadow-amber-950/35",
    badge: "bg-white text-amber-600",
    correctText: "text-slate-950",
    glow: "shadow-[0_0_46px_rgba(251,191,36,0.78)] ring-4 ring-white/80",
  },
  B: {
    card: "border-sky-100 bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-600 shadow-blue-950/35",
    badge: "bg-white text-blue-600",
    correctText: "text-white",
    glow: "shadow-[0_0_46px_rgba(59,130,246,0.78)] ring-4 ring-white/80",
  },
  C: {
    card: "border-emerald-100 bg-gradient-to-br from-emerald-400 via-teal-500 to-green-600 shadow-emerald-950/35",
    badge: "bg-white text-emerald-600",
    correctText: "text-slate-950",
    glow: "shadow-[0_0_46px_rgba(16,185,129,0.78)] ring-4 ring-white/80",
  },
  D: {
    card: "border-rose-100 bg-gradient-to-br from-rose-400 via-red-500 to-pink-600 shadow-rose-950/35",
    badge: "bg-white text-rose-600",
    correctText: "text-white",
    glow: "shadow-[0_0_46px_rgba(244,63,94,0.78)] ring-4 ring-white/80",
  },
};

function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

export function AnswerDistributionChart({ state, question }: AnswerDistributionChartProps) {
  const { counts, totalAnswers } = getQuizAnswerDistribution(state, question);
  const totalTeams = state.teams.length;
  const participationPercent = totalTeams ? Math.round((totalAnswers / totalTeams) * 100) : 0;
  const correctOption = question.options.find((option) => option.id === question.correctOptionId);

  return (
    <section className="relative flex h-full max-h-full min-h-0 overflow-hidden rounded-[clamp(0.875rem,1.6vw,1.5rem)] border border-white/25 bg-gradient-to-br from-[#172554] via-[#2636a7] to-[#6d28d9] p-2 text-white shadow-2xl shadow-blue-950/30 md:p-3 lg:p-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_12%,rgba(125,211,252,0.35),transparent_28%),radial-gradient(circle_at_84%_18%,rgba(216,180,254,0.32),transparent_30%),radial-gradient(circle_at_50%_105%,rgba(59,130,246,0.30),transparent_32%)]" />
      <div className="relative flex h-full min-h-0 w-full flex-col gap-2 overflow-hidden md:gap-3">
        <header className="flex shrink-0 items-center justify-between gap-3 rounded-2xl border border-white/16 bg-white/[0.10] px-3 py-2 shadow-xl shadow-blue-950/20 backdrop-blur md:px-4">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-100 md:text-sm">Cevap Sonuçları</p>

          <aside className="flex shrink-0 items-center gap-2">
            <div className="min-w-[4.75rem] rounded-xl border border-white/20 bg-white/[0.16] px-2.5 py-1.5 text-center backdrop-blur md:min-w-[5.5rem] md:px-3">
              <p className="text-[8px] font-black uppercase tracking-[0.16em] text-cyan-100 md:text-[9px]">Cevap</p>
              <p className="text-2xl font-black tabular-nums leading-none text-white md:text-3xl">{totalAnswers}</p>
            </div>
            <div className="min-w-[4.75rem] rounded-xl border border-white/20 bg-white/[0.16] px-2.5 py-1.5 text-center backdrop-blur md:min-w-[5.5rem] md:px-3">
              <p className="text-[8px] font-black uppercase tracking-[0.16em] text-cyan-100 md:text-[9px]">Katılım</p>
              <p className="text-2xl font-black tabular-nums leading-none text-white md:text-3xl">{participationPercent}%</p>
            </div>
          </aside>
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-2 grid-rows-2 gap-2 overflow-hidden md:gap-3">
          {question.options.map((option) => {
              const count = counts[option.id];
              const percent = totalAnswers ? (count / totalAnswers) * 100 : 0;
              const isCorrect = option.id === question.correctOptionId;
              const styles = optionStyles[option.id];

              return (
                <article
                  key={option.id}
                  className={`relative flex min-h-0 overflow-hidden rounded-[clamp(0.875rem,1.5vw,1.5rem)] border-[3px] p-3 transition md:p-4 lg:p-5 ${
                    styles.card
                  } ${isCorrect ? `${styles.glow} scale-[1.015]` : "opacity-50 saturate-[0.7] shadow-lg"}`}
                >
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white/30 to-transparent" />
                  {isCorrect ? (
                    <div className="absolute right-3 top-3 rounded-full border-2 border-white bg-white px-2.5 py-1 text-xs font-black text-slate-950 shadow-lg md:right-4 md:top-4 md:text-sm">
                      ✓ DOĞRU
                    </div>
                  ) : null}

                  <div className={`relative flex h-full min-h-0 w-full flex-col justify-between ${styles.correctText}`}>
                    <div className="flex min-h-0 items-start gap-2.5 pr-14 md:gap-3 md:pr-20">
                      <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-3xl font-black shadow-xl md:h-16 md:w-16 md:text-4xl lg:h-20 lg:w-20 ${styles.badge}`}>
                        {option.id}
                      </div>
                      <div className="min-w-0">
                        <p className="line-clamp-3 break-words text-xl font-black leading-tight drop-shadow-lg md:text-2xl lg:text-3xl">
                          {option.text}
                        </p>
                      </div>
                    </div>

                    <div className="mt-2 flex shrink-0 items-end justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.22em] opacity-80 md:text-xs">Oy</p>
                        <p className="text-4xl font-black tabular-nums leading-none drop-shadow-lg md:text-5xl lg:text-6xl">{count}</p>
                      </div>
                      <p className="text-4xl font-black tabular-nums leading-none drop-shadow-lg md:text-5xl lg:text-6xl">
                        {formatPercent(percent)}
                      </p>
                    </div>
                  </div>
                </article>
              );
            })}
        </div>

        <footer className="flex shrink-0 items-center justify-between gap-3 rounded-2xl border border-white/16 bg-white/[0.10] px-3 py-2 text-xs font-black text-white/85 backdrop-blur md:px-4 md:text-sm">
          <span>{totalTeams ? `${totalAnswers} / ${totalTeams} takım cevapladı` : "Takım yok"}</span>
          <span>Doğru cevap: {question.correctOptionId}{correctOption ? ` · ${correctOption.text}` : ""}</span>
        </footer>
      </div>
    </section>
  );
}
