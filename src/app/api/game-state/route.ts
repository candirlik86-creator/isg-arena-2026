import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, getCookieValue, isValidAdminSessionValue } from "@/lib/admin-auth";
import { applyGameAction, type GameAction, type GameActionResult } from "@/lib/game-actions";
import { canUseSupabaseGameState, mutateSupabaseGameState, readSupabaseGameState } from "@/lib/server/supabase-game-state";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const noStoreHeaders = {
  "Cache-Control": "no-store, max-age=0",
};

let gameStateMutationQueue = Promise.resolve();

async function runQueuedGameStateMutation<T>(mutation: () => Promise<T>) {
  const runMutation = gameStateMutationQueue.then(mutation, mutation);
  gameStateMutationQueue = runMutation.then(
    () => undefined,
    () => undefined,
  );
  return runMutation;
}

function supabaseUnavailableResponse() {
  return NextResponse.json({ ok: false, message: "Supabase bağlantısı yapılandırılmamış." }, { status: 503, headers: noStoreHeaders });
}

function supabaseErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Supabase işlemi başarısız.";
  return NextResponse.json({ ok: false, message }, { status: 503, headers: noStoreHeaders });
}

function isAdminRequest(request: Request) {
  const sessionCookie = getCookieValue(request.headers.get("cookie"), ADMIN_SESSION_COOKIE);
  return isValidAdminSessionValue(sessionCookie);
}

function isPublicGameAction(action: GameAction) {
  return (
    action.type === "joinTeam" ||
    action.type === "submitQuizAnswer" ||
    action.type === "submitForkliftRun" ||
    action.type === "advanceQuizIntro" ||
    action.type === "advanceFinalRoundTimedStep"
  );
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
    if (!isAdminRequest(request)) {
      return NextResponse.json({ ok: false, message: "Admin girişi gerekli." }, { status: 401, headers: noStoreHeaders });
    }

    const body = (await request.json()) as { state?: unknown };

    if (!("state" in body)) {
      const state = await readSupabaseGameState();
      return NextResponse.json({ ok: false, message: "state alanı gerekli.", state }, { status: 400, headers: noStoreHeaders });
    }

    const state = await runQueuedGameStateMutation(() => mutateSupabaseGameState(() => body.state as never));
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

    const action = body.action;
    const result = await runQueuedGameStateMutation(async () => {
      let actionResult: GameActionResult | null = null;
      if (!isPublicGameAction(action) && !isAdminRequest(request)) {
        return { unauthorized: true as const };
      }

      const state = await mutateSupabaseGameState((currentState) => {
        actionResult = applyGameAction(currentState, action);
        return actionResult.state;
      });
      if (!actionResult) {
        throw new Error("Oyun aksiyonu uygulanamadı.");
      }
      const finalActionResult: GameActionResult = actionResult;

      return {
        ...finalActionResult,
        state,
      };
    });

    if ("unauthorized" in result) {
      return NextResponse.json(
        { ok: false, message: "Admin girişi gerekli." },
        { status: 401, headers: noStoreHeaders },
      );
    }

    return NextResponse.json({
      ...result,
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
