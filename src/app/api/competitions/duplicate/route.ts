import { NextResponse } from "next/server";
import { supabaseAdminRequest } from "@/lib/server/supabase-admin";

type CompetitionRow = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  settings: unknown;
  flow_items: unknown[];
};

function toSavedCompetition(row: CompetitionRow) {
  return {
    id: row.id,
    name: row.name,
    createdAt: Date.parse(row.created_at),
    updatedAt: Date.parse(row.updated_at),
    deletedAt: row.deleted_at ? Date.parse(row.deleted_at) : undefined,
    settings: row.settings,
    flowItems: row.flow_items,
  };
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as { id?: string };
    if (!payload.id) {
      return NextResponse.json({ ok: false, message: "Yarışma kimliği eksik." }, { status: 400 });
    }

    const sourceRows = await supabaseAdminRequest<CompetitionRow[]>(`competitions?select=*&id=eq.${encodeURIComponent(payload.id)}&deleted_at=is.null`, { method: "GET" });
    const source = sourceRows[0];

    if (!source) {
      return NextResponse.json({ ok: false, message: "Kayıtlı yarışma bulunamadı." }, { status: 404 });
    }

    const duplicated = await supabaseAdminRequest<CompetitionRow[]>("competitions", {
      method: "POST",
      body: JSON.stringify({
        name: source.name.endsWith(" Kopya") ? source.name : `${source.name} Kopya`,
        settings: source.settings,
        flow_items: source.flow_items,
      }),
    });

    return NextResponse.json({ ok: true, data: toSavedCompetition(duplicated[0]) });
  } catch (error) {
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : "Yarışma kopyalanamadı." }, { status: 500 });
  }
}
