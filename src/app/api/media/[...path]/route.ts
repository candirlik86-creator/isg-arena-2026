import { NextResponse } from "next/server";

export const runtime = "nodejs";

const STORAGE_BUCKET = "game-media";

function getSupabaseConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return {
    supabaseUrl: supabaseUrl.replace(/\/$/, ""),
    serviceRoleKey,
  };
}

function sanitizePathSegments(segments: string[]) {
  if (!segments.length) {
    return null;
  }

  if (segments.some((segment) => !segment || segment === "." || segment === "..")) {
    return null;
  }

  const objectPath = segments.join("/");
  return objectPath.startsWith("uploads/") ? objectPath : null;
}

export async function GET(request: Request, context: { params: Promise<{ path?: string[] }> }) {
  const config = getSupabaseConfig();

  if (!config) {
    return NextResponse.json({ ok: false, message: "Supabase yapılandırması eksik." }, { status: 503 });
  }

  const params = await context.params;
  const objectPath = sanitizePathSegments(params.path ?? []);

  if (!objectPath) {
    return NextResponse.json({ ok: false, message: "Geçersiz medya yolu." }, { status: 400 });
  }

  const range = request.headers.get("range");
  const storageUrl = `${config.supabaseUrl}/storage/v1/object/authenticated/${STORAGE_BUCKET}/${objectPath}`;
  const storageResponse = await fetch(storageUrl, {
    method: "GET",
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      ...(range ? { Range: range } : {}),
    },
  });

  if (!storageResponse.ok) {
    const errorText = await storageResponse.text();
    return NextResponse.json(
      {
        ok: false,
        message: `Medya okunamadı. Supabase media error (${storageResponse.status} ${storageResponse.statusText}): ${errorText || "unknown error"}`,
      },
      { status: storageResponse.status },
    );
  }

  const headers = new Headers();
  const contentType = storageResponse.headers.get("content-type");
  const contentLength = storageResponse.headers.get("content-length");
  const contentRange = storageResponse.headers.get("content-range");
  const acceptRanges = storageResponse.headers.get("accept-ranges") ?? "bytes";

  if (contentType) headers.set("Content-Type", contentType);
  if (contentLength) headers.set("Content-Length", contentLength);
  if (contentRange) headers.set("Content-Range", contentRange);
  headers.set("Accept-Ranges", acceptRanges);
  headers.set("Cache-Control", "public, max-age=31536000, immutable");

  return new Response(storageResponse.body, {
    status: storageResponse.status,
    headers,
  });
}
