"use client";

import { useState } from "react";
import { AnswerButtons } from "@/components/AnswerButtons";
import { Countdown } from "@/components/Countdown";
import { StageBadge } from "@/components/StageBadge";
import { activeQuestion, type AnswerOption } from "@/data/questions";
import { calculateQuestionScore } from "@/lib/scoring";

export default function PlayPage() {
  const [selectedOptionId, setSelectedOptionId] = useState<AnswerOption["id"]>();
  const [submitted, setSubmitted] = useState(false);

  const scorePreview = selectedOptionId
    ? calculateQuestionScore({
        isCorrect: selectedOptionId === activeQuestion.correctOptionId,
        answerTimeMs: 12_000,
        timeLimitMs: activeQuestion.timeLimitSeconds * 1000,
      })
    : null;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#1e3a8a_0%,transparent_34%),#020617] p-4 text-white">
      <div className="mx-auto max-w-xl space-y-5">
        <header className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-2xl">
          <StageBadge label="Mobil cevap ekranı" />
          <label className="mt-5 block">
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400">Takım adı</span>
            <input defaultValue="Sarı Baretler" className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-2xl font-black outline-none focus:border-amber-300" />
          </label>
        </header>

        <section className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-5 shadow-2xl">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-amber-200">Soru {activeQuestion.id}/10</p>
            <p className="rounded-full bg-emerald-400/15 px-4 py-2 text-sm font-black text-emerald-100">{activeQuestion.topic}</p>
          </div>
          <h1 className="mt-5 text-3xl font-black leading-tight">{activeQuestion.title}</h1>
        </section>

        <Countdown seconds={18} totalSeconds={activeQuestion.timeLimitSeconds} label="Telefon süresi" />

        <AnswerButtons options={activeQuestion.options} selectedOptionId={selectedOptionId} onSelect={setSelectedOptionId} disabled={submitted} />

        <button
          type="button"
          disabled={!selectedOptionId || submitted}
          onClick={() => setSubmitted(true)}
          className="w-full rounded-2xl bg-amber-300 px-6 py-5 text-2xl font-black text-slate-950 shadow-xl shadow-amber-500/20 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
        >
          {submitted ? "Cevap Gönderildi" : "Cevabı Gönder"}
        </button>

        {submitted ? (
          <div className="rounded-[2rem] border border-emerald-300/30 bg-emerald-400/15 p-5 text-center">
            <p className="text-2xl font-black text-emerald-100">Cevabın alındı.</p>
            <p className="mt-2 text-sm font-semibold text-slate-300">Demo puan ön izlemesi: {scorePreview?.totalScore ?? 0} puan</p>
          </div>
        ) : null}
      </div>
    </main>
  );
}
