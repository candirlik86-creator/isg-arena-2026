import { formatPrize, type GameSettings, type LeaderboardEntry } from "@/lib/game-state";

type PodiumProps = {
  teams: LeaderboardEntry[];
  settings: GameSettings;
};

const podiumSlots = [
  {
    place: 2,
    order: "lg:order-1",
    height: "h-[15rem] md:h-[18rem] lg:h-[21rem]",
    revealClass: "animate-[podium-reveal_1.1s_ease-out_3s_both]",
    cardTone: "border-slate-100/30 bg-slate-100/[0.11] shadow-sky-100/20",
    podiumTone: "from-white via-slate-300 to-slate-700",
    badgeTone: "from-white via-slate-300 to-slate-600 text-slate-950 shadow-slate-100/35",
    glowTone: "bg-sky-200/25",
  },
  {
    place: 1,
    order: "lg:order-2",
    height: "h-[19rem] md:h-[23rem] lg:h-[27rem]",
    revealClass: "animate-[champion-reveal_1.2s_cubic-bezier(0.16,1,0.3,1)_6s_both]",
    cardTone: "border-yellow-100/55 bg-yellow-200/[0.18] shadow-yellow-300/40",
    podiumTone: "from-yellow-100 via-yellow-300 to-amber-500",
    badgeTone: "from-yellow-50 via-yellow-300 to-amber-500 text-slate-950 shadow-yellow-200/55",
    glowTone: "bg-amber-300/35",
  },
  {
    place: 3,
    order: "lg:order-3",
    height: "h-[12rem] md:h-[15rem] lg:h-[18rem]",
    revealClass: "animate-[podium-reveal_1.1s_ease-out_0s_both]",
    cardTone: "border-amber-700/35 bg-amber-900/[0.18] shadow-amber-800/25",
    podiumTone: "from-[#c58a48] via-[#87512a] to-[#3f2413]",
    badgeTone: "from-[#d39a55] via-[#8a542c] to-[#3f2413] text-amber-50 shadow-amber-800/40",
    glowTone: "bg-amber-800/30",
  },
] as const;

function formatScore(score: number) {
  return score.toLocaleString("tr-TR");
}

function ConfettiField() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {Array.from({ length: 44 }).map((_, index) => (
        <span
          key={index}
          className="absolute top-[-16%] rounded-full opacity-0 shadow-lg shadow-amber-300/20 animate-[confetti-fall_7s_linear_infinite]"
          style={{
            left: `${3 + ((index * 23) % 96)}%`,
            width: `${5 + (index % 4) * 2}px`,
            height: `${10 + (index % 5) * 3}px`,
            animationDelay: `-${(index % 18) * 0.36}s`,
            transform: `rotate(${index * 23}deg)`,
            backgroundColor:
              index % 4 === 0
                ? "rgba(251,191,36,0.9)"
                : index % 4 === 1
                  ? "rgba(125,211,252,0.85)"
                  : index % 4 === 2
                    ? "rgba(244,114,182,0.82)"
                    : "rgba(255,255,255,0.72)",
          }}
        />
      ))}
    </div>
  );
}

function getPodiumTeam(teams: LeaderboardEntry[], place: number) {
  const team = teams[place - 1];

  return {
    name: team?.name?.trim() || "Takım bekleniyor",
    score: team?.score ?? 0,
    isPlaceholder: !team,
  };
}

export function Podium({ teams, settings }: PodiumProps) {
  const winners = teams.slice(0, 3);
  const prizes = [settings.prizeFirst, settings.prizeSecond, settings.prizeThird];
  const perPersonDivisor = settings.teamSize > 0 ? settings.teamSize : 1;

  return (
    <section className="relative min-h-[72vh] overflow-hidden rounded-[2.5rem] border border-white/10 bg-[radial-gradient(circle_at_50%_7%,rgba(250,204,21,0.22),transparent_24%),radial-gradient(circle_at_18%_28%,rgba(56,189,248,0.18),transparent_32%),radial-gradient(circle_at_82%_30%,rgba(99,102,241,0.20),transparent_34%),linear-gradient(180deg,rgba(3,7,18,0.98)_0%,rgba(12,21,50,0.97)_45%,rgba(2,6,23,1)_100%)] px-5 pb-6 pt-4 shadow-2xl shadow-black/60 md:px-8 md:pb-8">
      <style>{`
        @keyframes podium-reveal {
          from { opacity: 0; transform: translateY(64px) scale(0.92); filter: blur(10px); }
          to { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
        }
        @keyframes champion-reveal {
          0% { opacity: 0; transform: translateY(86px) scale(0.86); filter: blur(12px); }
          68% { opacity: 1; transform: translateY(-12px) scale(1.035); filter: blur(0); }
          100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
        }
        @keyframes spotlight-sweep {
          0%, 100% { opacity: 0.28; transform: rotate(-7deg) scaleY(1); }
          50% { opacity: 0.56; transform: rotate(7deg) scaleY(1.06); }
        }
        @keyframes champion-pin-spot {
          0% { opacity: 0; transform: translateX(-50%) scaleX(0.72) scaleY(0.78); }
          16% { opacity: 0.88; transform: translateX(-50%) scaleX(0.92) scaleY(1); }
          52% { opacity: 0.5; transform: translateX(-50%) scaleX(1.02) scaleY(1.04); }
          100% { opacity: 0; transform: translateX(-50%) scaleX(1.06) scaleY(1.08); }
        }
        @keyframes champion-floor-glow {
          0% { opacity: 0; transform: translateX(-50%) scale(0.72); }
          18% { opacity: 0.7; transform: translateX(-50%) scale(1); }
          62% { opacity: 0.44; transform: translateX(-50%) scale(1.12); }
          100% { opacity: 0; transform: translateX(-50%) scale(1.18); }
        }
        @keyframes confetti-fall {
          0% { opacity: 0; transform: translateY(-12vh) rotate(0deg); }
          8% { opacity: 0.95; }
          82% { opacity: 0.88; }
          100% { opacity: 0; transform: translateY(100vh) rotate(680deg); }
        }
      `}</style>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[38%] bg-[radial-gradient(ellipse_at_center,rgba(250,204,21,0.18),transparent_36%),linear-gradient(180deg,transparent,rgba(15,23,42,0.72)_42%,rgba(2,6,23,0.98))]" aria-hidden />
      <div className="pointer-events-none absolute left-1/2 top-0 h-[80vh] w-[30rem] origin-top -translate-x-1/2 bg-amber-200/18 blur-2xl animate-[spotlight-sweep_5.2s_ease-in-out_infinite]" aria-hidden />
      <div className="pointer-events-none absolute left-[13%] top-0 h-[66vh] w-64 origin-top rotate-[-18deg] bg-sky-300/12 blur-2xl" aria-hidden />
      <div className="pointer-events-none absolute right-[13%] top-0 h-[66vh] w-64 origin-top rotate-[18deg] bg-indigo-300/12 blur-2xl" aria-hidden />
      <div className="pointer-events-none absolute left-1/2 top-[-1rem] h-[39rem] w-[28rem] origin-top bg-[linear-gradient(180deg,rgba(255,255,255,0.82)_0%,rgba(253,224,71,0.34)_34%,rgba(251,191,36,0.12)_66%,transparent_100%)] opacity-0 blur-xl [clip-path:polygon(45%_0,55%_0,100%_100%,0_100%)] animate-[champion-pin-spot_2.8s_ease-out_6s_both]" aria-hidden />
      <div className="pointer-events-none absolute left-1/2 bottom-[22%] h-20 w-[34rem] rounded-full bg-amber-200/35 opacity-0 blur-2xl animate-[champion-floor-glow_2.8s_ease-out_6s_both]" aria-hidden />
      <ConfettiField />

      <div className="relative flex min-h-[68vh] flex-col">
        <div className="mx-auto mb-2 rounded-full border border-white/15 bg-white/[0.07] px-7 py-3 text-center shadow-2xl shadow-black/25 backdrop-blur-md">
          <p className="text-xs font-black uppercase tracking-[0.46em] text-amber-100/90 md:text-sm">Yarışma Sonuçları</p>
        </div>

        <div className="grid min-h-0 flex-1 items-end gap-5 lg:grid-cols-3 lg:gap-7">
          {podiumSlots.map((slot) => {
            const team = getPodiumTeam(winners, slot.place);
            const prize = prizes[slot.place - 1];

            return (
              <article key={slot.place} className={`${slot.order} ${slot.revealClass} flex min-h-0 flex-col items-center text-center opacity-0`}>
                <div className={`relative z-10 w-full ${slot.place === 1 ? "max-w-[33rem]" : "max-w-[30rem]"}`}>
                  <div className={`absolute -inset-8 rounded-[3rem] ${slot.glowTone} blur-3xl`} aria-hidden />
                  <div className={`relative overflow-hidden rounded-[2rem] border px-5 py-5 shadow-2xl backdrop-blur-xl ${slot.cardTone}`}>
                    <div className="absolute inset-x-8 top-0 h-px bg-white/50" aria-hidden />
                    <div
                      className={`mx-auto -mt-1 mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br text-4xl font-black shadow-2xl ${slot.badgeTone} ${
                        slot.place === 1 ? "h-20 w-20 rounded-[1.65rem] text-5xl" : ""
                      }`}
                    >
                      {slot.place}
                    </div>
                    <h3
                      className={`font-black leading-tight text-white drop-shadow-2xl ${
                        slot.place === 1 ? "text-5xl md:text-6xl" : "text-4xl md:text-5xl"
                      } ${team.isPlaceholder ? "text-white/70" : ""}`}
                    >
                      {team.name}
                    </h3>
                    <p className={`mt-3 text-4xl font-black tabular-nums md:text-5xl ${team.isPlaceholder ? "text-white/[0.55]" : "text-amber-100"}`}>
                      {formatScore(team.score)} puan
                    </p>
                    {!team.isPlaceholder && (
                      <div className="mt-4 border-t border-white/15 pt-3">
                        <p className="text-3xl font-black tabular-nums text-white drop-shadow-lg md:text-4xl">
                          {formatPrize(prize, settings.currency)}
                        </p>
                        <p className="mt-1 text-base font-bold text-emerald-100 md:text-lg">
                          Kişi başı {formatPrize(Math.round(prize / perPersonDivisor), settings.currency)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div
                  className={`relative -mt-3 flex w-[88%] max-w-[31rem] flex-col justify-end overflow-hidden rounded-t-[2rem] rounded-b-[1.25rem] bg-gradient-to-br ${slot.podiumTone} ${slot.height} shadow-[0_28px_70px_rgba(0,0,0,0.45)]`}
                >
                  <div className="absolute inset-x-0 top-0 h-7 bg-white/35" aria-hidden />
                  <div className="absolute inset-y-0 left-0 w-1/3 bg-white/[0.18] blur-xl" aria-hidden />
                  <div className="absolute inset-x-5 top-6 h-px bg-white/45" aria-hidden />
                  <div className="absolute inset-x-0 bottom-0 h-16 bg-black/18" aria-hidden />
                  <div className="relative flex h-full items-center justify-center text-[7rem] font-black leading-none text-slate-950/75 drop-shadow-lg md:text-[8.5rem]">
                    {slot.place}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
