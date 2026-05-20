import { ScreenProductMark } from "@/components/ScreenProductMark";
import { getScreenSurfaceAttributes, resolveBrandSettings } from "@/lib/brand-theme";
import type { GameSettings } from "@/lib/game-state";
import type { ReactNode } from "react";

type ProjectionFrameProps = {
  children: ReactNode;
  eyebrow?: string;
  title?: string;
  compactScreen?: boolean;
  screenSettings?: Partial<GameSettings>;
};

export function ProjectionFrame({
  children,
  eyebrow = "İSG Arena 2026",
  title = "Bil, Fark Et, Güvenli Karar Ver",
  compactScreen = false,
  screenSettings,
}: ProjectionFrameProps) {
  if (compactScreen) {
    const surface = getScreenSurfaceAttributes(screenSettings ?? {});
    const brand = resolveBrandSettings(screenSettings ?? {});

    return (
      <main
        {...surface}
        className={`${surface.className} box-border h-[100dvh] max-h-[100dvh] overflow-hidden p-1.5 text-white sm:p-2 md:p-3`}
      >
        <div className="relative mx-auto flex h-full max-h-full min-h-0 w-full max-w-[1600px] flex-col overflow-hidden rounded-[clamp(1rem,2.5vw,2rem)] border border-white/25 bg-white/[0.12] p-3 shadow-2xl shadow-blue-950/25 backdrop-blur md:p-4">
          <ScreenProductMark productBrandName={brand.productBrandName} />
          <header className="mb-2 h-4 shrink-0 md:mb-2 md:h-5" aria-hidden />
          <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,#1e3a8a_0%,transparent_32%),radial-gradient(circle_at_bottom_right,#ca8a04_0%,transparent_26%),#020617] p-4 text-white md:p-8">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-7xl flex-col rounded-[3rem] border border-white/10 bg-black/30 p-5 shadow-2xl shadow-black/50 backdrop-blur md:min-h-[calc(100vh-4rem)] md:p-8">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.36em] text-amber-200">{eyebrow}</p>
            <h1 className="mt-2 text-3xl font-black md:text-6xl">{title}</h1>
          </div>
          <div className="rounded-2xl border border-emerald-300/30 bg-emerald-400/10 px-5 py-3 text-right font-bold text-emerald-100">İSG Arena 2026<br /><span className="text-xs uppercase tracking-widest text-slate-300">Projeksiyon Hazır</span></div>
        </header>
        <div className="flex-1">{children}</div>
      </div>
    </main>
  );
}
