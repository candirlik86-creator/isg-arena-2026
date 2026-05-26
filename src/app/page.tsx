import Link from "next/link";
import { TeamJoinPanel } from "@/components/TeamJoinPanel";

const navItems = [
  { href: "#katil", label: "Katıl" },
  { href: "/admin", label: "Oluştur" },
  { href: "/admin", label: "Kütüphane" },
  { href: "/screen", label: "Projeksiyon" },
];

export default function Home() {
  return (
    <main className="arena-play-bg min-h-screen text-white">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
        <Link href="/" className="shrink-0 text-xl font-black tracking-tight text-white">
          HSE Arena
        </Link>

        <nav className="flex flex-wrap items-center justify-end gap-2 text-sm font-black sm:gap-3">
          {navItems.map((item) => (
            <Link
              key={`${item.href}-${item.label}`}
              href={item.href}
              className="rounded-xl border border-white/15 bg-white/[0.10] px-3 py-2 text-white shadow-lg shadow-blue-950/10 transition hover:border-amber-200/70 hover:bg-amber-300/15 sm:px-4"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      <section id="katil" className="mx-auto flex min-h-[calc(100vh-5.5rem)] w-full max-w-6xl items-center px-4 pb-8 pt-4 sm:px-6 lg:px-8">
        <div className="w-full">
          <TeamJoinPanel title="PIN ile Yarışmaya Katıl" />
        </div>
      </section>
    </main>
  );
}
