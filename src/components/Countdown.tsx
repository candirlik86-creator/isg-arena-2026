type CountdownProps = {
  seconds: number;
  totalSeconds?: number;
  label?: string;
};

export function Countdown({ seconds, totalSeconds = 30, label = "Kalan Süre" }: CountdownProps) {
  const progress = Math.max(0, Math.min(100, (seconds / totalSeconds) * 100));

  return (
    <div className="rounded-[1.75rem] border border-white/25 bg-white/[0.16] p-5 shadow-2xl shadow-blue-950/20 backdrop-blur">
      <div className="flex items-end justify-between gap-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-100">{label}</p>
          <p className="mt-2 text-7xl font-black tabular-nums text-white md:text-8xl">{seconds}</p>
        </div>
        <div className="mb-3 rounded-2xl border border-red-200/25 bg-red-500/15 px-4 py-2 text-sm font-bold text-red-100">Risk zamanı azalıyor</div>
      </div>
      <div className="mt-5 h-5 overflow-hidden rounded-full border border-white/20 bg-white/25 shadow-inner">
        <div className="h-full rounded-full bg-gradient-to-r from-emerald-300 via-amber-300 to-red-500 shadow-lg transition-all" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}
