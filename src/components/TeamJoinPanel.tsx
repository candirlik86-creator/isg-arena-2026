"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useGameState } from "@/hooks/useGameState";

type TeamJoinPanelProps = {
  redirectToPlay?: boolean;
  title?: string;
};

export function TeamJoinPanel({ redirectToPlay = false, title = "PIN ile Arenaya Katıl" }: TeamJoinPanelProps) {
  const router = useRouter();
  const { state, currentTeam, joinTeam } = useGameState();
  const [pin, setPin] = useState("");
  const [pinAccepted, setPinAccepted] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [error, setError] = useState("");

  const validatePin = () => {
    if (pin.trim() !== state.settings.gamePin) {
      setError("PIN hatalı. Projeksiyon ekranındaki PIN'i girin.");
      return;
    }

    setError("");
    setPinAccepted(true);
  };

  const submitTeam = () => {
    const result = joinTeam(pin, teamName);

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
    <div className="mx-auto max-w-2xl rounded-[2.5rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl md:p-10">
      <p className="text-sm font-bold uppercase tracking-[0.3em] text-amber-200">İSG Arena 2026</p>
      <h2 className="mt-3 text-4xl font-black text-white md:text-5xl">{title}</h2>
      <p className="mt-4 text-lg font-semibold text-slate-300">
        Önce projeksiyon ekranındaki oyun PIN'ini girin, sonra takım adınızı yazın.
      </p>

      <div className="mt-8 space-y-5">
        <label className="block">
          <span className="text-sm font-bold uppercase tracking-[0.25em] text-slate-300">Oyun PIN'i</span>
          <input
            value={pin}
            onChange={(event) => {
              setPin(event.target.value.replace(/\D/g, "").slice(0, 4));
              setPinAccepted(false);
            }}
            inputMode="numeric"
            autoComplete="one-time-code"
            className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-5 py-5 text-center text-5xl font-black tracking-[0.24em] text-white outline-none ring-amber-300/40 transition placeholder:text-slate-600 focus:border-amber-300 focus:ring-4"
            placeholder="0000"
          />
        </label>

        {!pinAccepted ? (
          <button type="button" onClick={validatePin} className="w-full rounded-2xl bg-amber-300 px-6 py-5 text-2xl font-black text-slate-950 shadow-xl shadow-amber-500/20">
            PIN'i Onayla
          </button>
        ) : (
          <>
            <label className="block">
              <span className="text-sm font-bold uppercase tracking-[0.25em] text-slate-300">Takım adı</span>
              <input
                value={teamName}
                onChange={(event) => setTeamName(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-5 py-4 text-2xl font-black text-white outline-none ring-amber-300/40 transition placeholder:text-slate-600 focus:border-amber-300 focus:ring-4"
                placeholder="Takım adınız"
              />
            </label>
            <button type="button" onClick={submitTeam} className="w-full rounded-2xl bg-emerald-300 px-6 py-5 text-2xl font-black text-slate-950 shadow-xl shadow-emerald-500/20">
              Katıl ve Cevap Ekranına Geç
            </button>
          </>
        )}

        {error ? <p className="rounded-2xl border border-red-300/30 bg-red-400/10 p-4 text-center text-lg font-bold text-red-100">{error}</p> : null}
        <p className="text-center text-sm font-bold text-slate-400">
          Katılan takım: {state.teams.length} / {state.settings.maxTeams}
        </p>
      </div>
    </div>
  );
}
