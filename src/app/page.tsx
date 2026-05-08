import Link from "next/link";
import { ProjectionFrame } from "@/components/ProjectionFrame";
import { StageBadge } from "@/components/StageBadge";

const navItems = [
  { href: "/admin", label: "Admin Paneli", description: "PIN, akış, skor ve final kontrolü" },
  { href: "/screen", label: "Projeksiyon", description: "Lobi, soru, medya ve podyum ekranı" },
  { href: "/join", label: "Takım Katılımı", description: "PIN gir, takım adıyla oyuna bağlan" },
  { href: "/play", label: "Telefon Ekranı", description: "Cevap ver ve final parkurunu oyna" },
];

export default function Home() {
  return (
    <ProjectionFrame title="Bil, Fark Et, Güvenli Karar Ver">
      <section className="grid min-h-[68vh] items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <StageBadge label="PIN ile canlı İSG yarışması" />
          <h2 className="mt-8 text-6xl font-black leading-none text-white md:text-8xl">
            İSG Arena <span className="text-amber-300">2026</span>
          </h2>
          <p className="mt-6 max-w-3xl text-2xl font-semibold leading-relaxed text-slate-300 md:text-3xl">
            Büyük ekrana hazır koyu tema, canlı lider tablosu, eğitim slaytları ve finalde oynanabilir Forklift Güvenli Sürüş Etabı.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="rounded-[2rem] border border-white/10 bg-white/[0.07] p-6 shadow-2xl transition hover:-translate-y-1 hover:border-amber-300/50 hover:bg-amber-300/10">
                <span className="text-xl font-black text-white">{item.label}</span>
                <span className="mt-3 block text-sm font-semibold text-slate-400">{item.description}</span>
              </Link>
            ))}
          </div>
        </div>
        <div className="rounded-[3rem] border border-amber-300/20 bg-amber-300/10 p-8 shadow-2xl shadow-amber-900/20">
          <p className="text-sm font-bold uppercase tracking-[0.28em] text-amber-200">Phase 2 demo akışı</p>
          <div className="mt-6 space-y-4 text-lg font-bold text-white">
            <div className="rounded-3xl bg-slate-950/70 p-5">PIN lobisi ve takım adıyla katılım</div>
            <div className="rounded-3xl bg-slate-950/70 p-5">Quiz, bilgi slaytı ve medya slaytı akışı</div>
            <div className="rounded-3xl bg-slate-950/70 p-5">3, 6 ve 8. quiz sonrası lider tablosu desteği</div>
            <div className="rounded-3xl bg-slate-950/70 p-5">Final: güvenli sürüşü ödüllendiren forklift parkuru</div>
          </div>
        </div>
      </section>
    </ProjectionFrame>
  );
}
