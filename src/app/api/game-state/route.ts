import { NextResponse } from "next/server";
import type { GameAction } from "@/lib/game-actions";
import { dispatchServerGameAction, readServerGameState, replaceServerGameState } from "@/lib/server-game-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const noStoreHeaders = {
  "Cache-Control": "no-store, max-age=0",
};

export async function GET() {
  return NextResponse.json({ state: readServerGameState() }, { headers: noStoreHeaders });
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as { state?: unknown };

    if (!("state" in body)) {
      return NextResponse.json({ ok: false, message: "state alanı gerekli.", state: readServerGameState() }, { status: 400 });
    }

    return NextResponse.json({ ok: true, state: replaceServerGameState(body.state) }, { headers: noStoreHeaders });
  } catch {
    return NextResponse.json({ ok: false, message: "Geçersiz JSON.", state: readServerGameState() }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as { action?: GameAction };

    if (!body.action) {
      return NextResponse.json({ ok: false, message: "action alanı gerekli.", state: readServerGameState() }, { status: 400 });
    }

    return NextResponse.json(dispatchServerGameAction(body.action), { headers: noStoreHeaders });
  } catch {
    return NextResponse.json({ ok: false, message: "Geçersiz JSON.", state: readServerGameState() }, { status: 400 });
  }
}
