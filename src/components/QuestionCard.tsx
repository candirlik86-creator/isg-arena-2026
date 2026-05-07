import type { ArenaQuestion } from "@/data/questions";
import { AnswerButtons } from "./AnswerButtons";
import { StageBadge } from "./StageBadge";

type QuestionCardProps = {
  question: ArenaQuestion;
  showOptions?: boolean;
  compact?: boolean;
};

export function QuestionCard({ question, showOptions = true, compact = false }: QuestionCardProps) {
  return (
    <article className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-slate-950/80 p-6 shadow-2xl shadow-black/40 backdrop-blur md:p-10">
      <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-amber-400/20 blur-3xl" />
      <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl" />
      <div className="relative">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <StageBadge label={`Soru ${question.id} / 10`} />
          <div className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-bold text-slate-300">{question.topic}</div>
        </div>
        <p className="mt-6 text-sm font-semibold uppercase tracking-[0.28em] text-amber-200">{question.stage}</p>
        <h2 className={`mt-4 font-black leading-tight text-white ${compact ? "text-3xl md:text-5xl" : "text-4xl md:text-7xl"}`}>{question.title}</h2>
        {question.note ? <p className="mt-5 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-lg font-semibold text-amber-100">{question.note}</p> : null}
        {showOptions ? <div className="mt-8"><AnswerButtons options={question.options} /></div> : null}
      </div>
    </article>
  );
}
