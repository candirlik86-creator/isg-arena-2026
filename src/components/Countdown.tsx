type CountdownProps = {
  seconds: number;
  totalSeconds?: number;
  label?: string;
};

export function Countdown({ seconds, totalSeconds = 30, label = "Kalan Süre" }: CountdownProps) {
  const progress = Math.max(0, Math.min(100, (seconds / totalSeconds) * 100));

  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-2xl shadow-black/30 backdrop-blur">
      <div className="flex items-end justify-between gap-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">{label}</p>
          <p className="mt-2 text-6xl font-black tabular-nums text-white md:text-8xl">{seconds}</p>
        </div>
        <div className="mb-3 rounded-2xl bg-red-500/15 px-4 py-2 text-sm font-bold text-red-200">Risk zamanı azalıyor</div>
      </div>
      <div className="mt-5 h-4 overflow-hidden rounded-full bg-slate-800">
        <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-amber-300 to-red-500 transition-all" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}
