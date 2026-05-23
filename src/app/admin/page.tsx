import { cookies } from "next/headers";
import { AdminPageClient } from "./admin-page-client";
import { ADMIN_SESSION_COOKIE, isValidAdminSessionValue } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

type AdminPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function AdminLoginScreen({ hasError }: { hasError: boolean }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-white">
      <form action="/api/admin/login" method="post" className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.08] p-6 shadow-2xl">
        <label className="block">
          <span className="text-xs font-black uppercase tracking-[0.24em] text-slate-300">Admin şifresi</span>
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            className="mt-3 w-full rounded-xl border border-white/15 bg-slate-900 px-4 py-3 text-lg font-bold text-white outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-300/20"
          />
        </label>
        {hasError ? <p className="mt-3 rounded-xl bg-red-500/15 px-3 py-2 text-sm font-bold text-red-100">Şifre hatalı.</p> : null}
        <button type="submit" className="mt-5 w-full rounded-xl bg-blue-600 px-4 py-3 text-base font-black text-white transition hover:bg-blue-500">
          Giriş Yap
        </button>
      </form>
    </main>
  );
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const cookieStore = await cookies();
  const isAuthenticated = isValidAdminSessionValue(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);

  if (!isAuthenticated) {
    const params = await searchParams;
    return <AdminLoginScreen hasError={params?.error === "1"} />;
  }

  return <AdminPageClient />;
}
