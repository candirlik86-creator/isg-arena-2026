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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const scope = searchParams.get("scope");
    const id = searchParams.get("id");

    const filters: string[] = ["select=*"];
    if (id) {
      filters.push(`id=eq.${encodeURIComponent(id)}`);
    } else if (scope === "trash") {
      filters.push("deleted_at=not.is.null");
    } else {
      filters.push("deleted_at=is.null");
    }

    filters.push(scope === "trash" ? "order=deleted_at.desc" : "order=updated_at.desc");

    const rows = await supabaseAdminRequest<CompetitionRow[]>(`competitions?${filters.join("&")}`, { method: "GET" });
    return NextResponse.json({ ok: true, data: rows.map(toSavedCompetition) });
  } catch (error) {
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : "Yarışmalar yüklenemedi." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as { name?: string; settings?: unknown; flowItems?: unknown[] };
    const row = await supabaseAdminRequest<CompetitionRow[]>("competitions", {
      method: "POST",
      body: JSON.stringify({
        name: payload.name,
        settings: payload.settings,
        flow_items: payload.flowItems ?? [],
      }),
    });

    return NextResponse.json({ ok: true, data: toSavedCompetition(row[0]) });
  } catch (error) {
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : "Yarışma kaydedilemedi." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const payload = (await request.json()) as { id?: string; name?: string; settings?: unknown; flowItems?: unknown[] };
    if (!payload.id) {
      return NextResponse.json({ ok: false, message: "Yarışma kimliği eksik." }, { status: 400 });
    }

    const row = await supabaseAdminRequest<CompetitionRow[]>(`competitions?id=eq.${encodeURIComponent(payload.id)}`, {
      method: "PATCH",
      body: JSON.stringify({
        name: payload.name,
        settings: payload.settings,
        flow_items: payload.flowItems ?? [],
        updated_at: new Date().toISOString(),
      }),
    });

    return NextResponse.json({ ok: true, data: toSavedCompetition(row[0]) });
  } catch (error) {
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : "Yarışma güncellenemedi." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ ok: false, message: "Yarışma kimliği eksik." }, { status: 400 });
    }

    await supabaseAdminRequest<CompetitionRow[]>(`competitions?id=eq.${encodeURIComponent(id)}`, { method: "DELETE" });
    return NextResponse.json({ ok: true, data: { id } });
  } catch (error) {
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : "Yarışma silinemedi." }, { status: 500 });
  }
}
