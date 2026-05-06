import Link from "next/link";
import { ProjectionFrame } from "@/components/ProjectionFrame";

const fields = ["Takım adı", "1. kişi", "2. kişi", "3. kişi"];

export default function JoinPage() {
  return (
    <ProjectionFrame eyebrow="Takım Katılımı" title="QR ile Arenaya Katıl">
      <div className="mx-auto max-w-3xl rounded-[2.5rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl md:p-10">
        <p className="text-xl font-semibold text-slate-300">Takım bilgilerini girin. Bu fazda kayıt mock akış olarak çalışır; sonraki faz Firebase için hazır yapıdadır.</p>
        <form className="mt-8 space-y-5">
          {fields.map((field) => (
            <label key={field} className="block">
              <span className="text-sm font-bold uppercase tracking-[0.25em] text-amber-200">{field}</span>
              <input className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-5 py-4 text-xl font-bold text-white outline-none ring-amber-300/40 transition placeholder:text-slate-600 focus:border-amber-300 focus:ring-4" placeholder={field} />
            </label>
          ))}
          <label className="block">
            <span className="text-sm font-bold uppercase tracking-[0.25em] text-amber-200">Birim / Depo</span>
            <select className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-5 py-4 text-xl font-bold text-white outline-none focus:border-amber-300">
              <option>Ana Depo</option>
              <option>Sevkiyat</option>
              <option>Hammadde</option>
              <option>Paketleme</option>
              <option>Soğuk Depo</option>
            </select>
          </label>
          <Link href="/play" className="block rounded-2xl bg-amber-300 px-6 py-5 text-center text-2xl font-black text-slate-950 shadow-xl shadow-amber-500/20">Katıl ve Cevap Ekranına Geç</Link>
        </form>
      </div>
    </ProjectionFrame>
  );
}
