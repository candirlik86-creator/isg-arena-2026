import { NextResponse } from "next/server";
import { supabaseAdminRequest } from "@/lib/server/supabase-admin";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as { id?: string };
    if (!payload.id) {
      return NextResponse.json({ ok: false, message: "Yarışma kimliği eksik." }, { status: 400 });
    }

    await supabaseAdminRequest(`competitions?id=eq.${encodeURIComponent(payload.id)}`, {
      method: "PATCH",
      body: JSON.stringify({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() }),
    });

    return NextResponse.json({ ok: true, data: { id: payload.id } });
  } catch (error) {
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : "Yarışma çöp kutusuna taşınamadı." }, { status: 500 });
  }
}
