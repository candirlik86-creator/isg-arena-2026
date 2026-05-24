import { NextResponse } from "next/server";
import { applyGameAction, type GameAction } from "@/lib/game-actions";
import { canUseSupabaseGameState, readSupabaseGameState, writeSupabaseGameState } from "@/lib/server/supabase-game-state";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const noStoreHeaders = {
  "Cache-Control": "no-store, max-age=0",
};

function supabaseUnavailableResponse() {
  return NextResponse.json({ ok: false, message: "Supabase bağlantısı yapılandırılmamış." }, { status: 503, headers: noStoreHeaders });
}

function supabaseErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Supabase işlemi başarısız.";
  return NextResponse.json({ ok: false, message }, { status: 503, headers: noStoreHeaders });
}

export async function GET() {
  if (!canUseSupabaseGameState()) {
    return supabaseUnavailableResponse();
  }

  try {
    const state = await readSupabaseGameState();
    return NextResponse.json({ state }, { headers: noStoreHeaders });
  } catch (error) {
    return supabaseErrorResponse(error);
  }
}

export async function PUT(request: Request) {
  if (!canUseSupabaseGameState()) {
    return supabaseUnavailableResponse();
  }

  try {
    const body = (await request.json()) as { state?: unknown };

    if (!("state" in body)) {
      const state = await readSupabaseGameState();
      return NextResponse.json({ ok: false, message: "state alanı gerekli.", state }, { status: 400, headers: noStoreHeaders });
    }

    const state = await writeSupabaseGameState(body.state);
    return NextResponse.json({ ok: true, state }, { headers: noStoreHeaders });
  } catch (error) {
    if (error instanceof SyntaxError) {
      try {
        const state = await readSupabaseGameState();
        return NextResponse.json({ ok: false, message: "Geçersiz JSON.", state }, { status: 400, headers: noStoreHeaders });
      } catch {
        return NextResponse.json({ ok: false, message: "Geçersiz JSON." }, { status: 400, headers: noStoreHeaders });
      }
    }

    return supabaseErrorResponse(error);
  }
}

export async function PATCH(request: Request) {
  if (!canUseSupabaseGameState()) {
    return supabaseUnavailableResponse();
  }

  try {
    const body = (await request.json()) as { action?: GameAction };

    if (!body.action) {
      const state = await readSupabaseGameState();
      return NextResponse.json({ ok: false, message: "action alanı gerekli.", state }, { status: 400, headers: noStoreHeaders });
    }

    const currentState = await readSupabaseGameState();
    const result = applyGameAction(currentState, body.action);
    const state = await writeSupabaseGameState(result.state);

    return NextResponse.json({
      ...result,
      state,
    }, { headers: noStoreHeaders });
  } catch (error) {
    if (error instanceof SyntaxError) {
      try {
        const state = await readSupabaseGameState();
        return NextResponse.json({ ok: false, message: "Geçersiz JSON.", state }, { status: 400, headers: noStoreHeaders });
      } catch {
        return NextResponse.json({ ok: false, message: "Geçersiz JSON." }, { status: 400, headers: noStoreHeaders });
      }
    }

    return supabaseErrorResponse(error);
  }
}
