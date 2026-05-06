import Link from "next/link";
import { ProjectionFrame } from "@/components/ProjectionFrame";
import { StageBadge } from "@/components/StageBadge";

const navItems = [
  { href: "/admin", label: "Admin Paneli", description: "Soruyu ilerlet, tabloyu yönet" },
  { href: "/screen", label: "Projeksiyon Ekranı", description: "Sahne, QR ve lider tablosu" },
  { href: "/join", label: "Takım Katılımı", description: "30 takım için QR akışı" },
];

export default function Home() {
  return (
    <ProjectionFrame title="Bil, Fark Et, Güvenli Karar Ver">
      <section className="grid min-h-[68vh] items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <StageBadge label="Kahoot benzeri İSG yarışması" />
          <h2 className="mt-8 text-6xl font-black leading-none text-white md:text-8xl">İSG Arena <span className="text-amber-300">2026</span></h2>
          <p className="mt-6 max-w-3xl text-2xl font-semibold leading-relaxed text-slate-300 md:text-3xl">30 takım, QR katılım, 4 seçenekli sorular, canlı lider tablosu ve projeksiyona hazır profesyonel yayın deneyimi.</p>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="rounded-[2rem] border border-white/10 bg-white/[0.07] p-6 shadow-2xl transition hover:-translate-y-1 hover:border-amber-300/50 hover:bg-amber-300/10">
                <span className="text-xl font-black text-white">{item.label}</span>
                <span className="mt-3 block text-sm font-semibold text-slate-400">{item.description}</span>
              </Link>
            ))}
          </div>
        </div>
        <div className="rounded-[3rem] border border-amber-300/20 bg-amber-300/10 p-8 shadow-2xl shadow-amber-900/20">
          <p className="text-sm font-bold uppercase tracking-[0.28em] text-amber-200">Demo akışı</p>
          <div className="mt-6 space-y-4 text-lg font-bold text-white">
            <div className="rounded-3xl bg-slate-950/70 p-5">10 soru · Her soru 1000 puan</div>
            <div className="rounded-3xl bg-slate-950/70 p-5">Doğru cevap 700 + hız puanı 300</div>
            <div className="rounded-3xl bg-slate-950/70 p-5">Lider tablosu yalnızca 3, 6 ve 8 sonrası</div>
            <div className="rounded-3xl bg-slate-950/70 p-5">5. soru: Forklift Güvenli Sürüş Etabı</div>
          </div>
        </div>
      </section>
    </ProjectionFrame>
  );
}
