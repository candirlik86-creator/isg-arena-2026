const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function ensureSupabaseEnv() {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase ortam değişkenleri eksik.");
  }
}

export async function supabaseAdminRequest<T>(pathAndQuery: string, init?: RequestInit): Promise<T> {
  ensureSupabaseEnv();

  const response = await fetch(`${supabaseUrl}/rest/v1/${pathAndQuery}`, {
    ...init,
    headers: {
      apikey: serviceRoleKey as string,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Supabase isteği başarısız.");
  }

  if (response.status === 204) {
    return [] as T;
  }

  return (await response.json()) as T;
}
