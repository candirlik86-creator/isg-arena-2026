"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { useGameState } from "@/hooks/useGameState";

type TeamJoinPanelProps = {
  redirectToPlay?: boolean;
  title?: string;
};

export function TeamJoinPanel({ redirectToPlay = false, title = "PIN ile Arenaya Katıl" }: TeamJoinPanelProps) {
  const router = useRouter();
  const { state, currentTeam, joinTeam } = useGameState();
  const [pin, setPin] = useState("");
  const [teamName, setTeamName] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submitTeam = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    const result = await joinTeam(pin, teamName);
    setSubmitting(false);

    if (!result.ok) {
      setError(result.message ?? "Takım katılımı tamamlanamadı.");
      return;
    }

    setError("");
    if (redirectToPlay) {
      router.push("/play");
    }
  };

  if (currentTeam) {
    return (
      <div className="mx-auto max-w-2xl rounded-[2rem] border border-emerald-300/30 bg-emerald-400/10 p-6 text-center shadow-2xl">
        <p className="text-sm font-bold uppercase tracking-[0.3em] text-emerald-200">Takım bağlı</p>
        <h2 className="mt-3 text-4xl font-black text-white">{currentTeam.name}</h2>
        <Link href="/play" className="mt-6 inline-flex rounded-2xl bg-amber-300 px-6 py-4 text-xl font-black text-slate-950">
          Cevap Ekranına Geç
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl rounded-[2rem] border border-white/20 bg-white/[0.12] p-5 shadow-2xl shadow-blue-950/20 backdrop-blur md:p-8">
      <p className="text-sm font-bold uppercase tracking-[0.3em] text-amber-200">İSG Arena 2026</p>
      <h2 className="mt-3 text-4xl font-black leading-tight text-white md:text-5xl">{title}</h2>
      <p className="mt-4 text-lg font-semibold text-blue-50">Projeksiyon PIN'ini ve takım adınızı yazın.</p>

      <form onSubmit={submitTeam} className="mt-8 space-y-5">
        <label className="block">
          <span className="text-sm font-bold uppercase tracking-[0.25em] text-blue-50">PIN</span>
          <input
            value={pin}
            onChange={(event) => {
              setPin(event.target.value.replace(/\D/g, "").slice(0, 4));
              setError("");
            }}
            inputMode="numeric"
            autoComplete="one-time-code"
            className="mt-2 w-full rounded-2xl border border-white/20 bg-slate-950/65 px-5 py-5 text-center text-5xl font-black tracking-[0.24em] text-white outline-none ring-amber-300/40 transition placeholder:text-slate-500 focus:border-amber-300 focus:ring-4"
            placeholder="0000"
          />
        </label>

        <label className="block">
          <span className="text-sm font-bold uppercase tracking-[0.25em] text-blue-50">Takım adı</span>
          <input
            value={teamName}
            onChange={(event) => {
              setTeamName(event.target.value);
              setError("");
            }}
            autoComplete="organization"
            className="mt-2 w-full rounded-2xl border border-white/20 bg-slate-950/65 px-5 py-5 text-2xl font-black text-white outline-none ring-amber-300/40 transition placeholder:text-slate-500 focus:border-amber-300 focus:ring-4"
            placeholder="Takım adınız"
          />
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-2xl bg-amber-300 px-6 py-5 text-2xl font-black text-slate-950 shadow-xl shadow-amber-500/20 transition hover:bg-amber-200 focus:outline-none focus:ring-4 focus:ring-amber-100/50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Katılım Kaydediliyor" : "Oyuna Katıl"}
        </button>

        {error ? <p className="rounded-2xl border border-red-300/30 bg-red-400/10 p-4 text-center text-lg font-bold text-red-100">{error}</p> : null}
        <p className="text-center text-sm font-bold text-blue-100">
          Katılan takım: {state.teams.length} / {state.settings.maxTeams}
        </p>
      </form>
    </div>
  );
}
