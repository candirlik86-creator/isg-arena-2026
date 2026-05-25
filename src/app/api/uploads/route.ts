import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, getCookieValue, isValidAdminSessionValue } from "@/lib/admin-auth";

export const runtime = "nodejs";

const MAX_UPLOAD_BYTES = 30 * 1024 * 1024;
const allowedMimePrefixes = ["image/", "video/"];
const STORAGE_BUCKET = "game-media";

function createSafeName(fileName: string) {
  const normalized = fileName.toLowerCase().trim();
  const dotIndex = normalized.lastIndexOf(".");
  const extension = dotIndex > -1 ? normalized.slice(dotIndex).replace(/[^.a-z0-9]/g, "") : "";
  const rawBase = dotIndex > -1 ? normalized.slice(0, dotIndex) : normalized;
  const baseName = rawBase.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48);
  return `${baseName || "media"}${extension}`;
}

function createObjectPath(fileName: string) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8);
  const safeName = createSafeName(fileName);
  return `uploads/${timestamp}-${random}-${safeName}`;
}

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

export async function POST(request: Request) {
  try {
    const sessionCookie = getCookieValue(request.headers.get("cookie"), ADMIN_SESSION_COOKIE);
    if (!isValidAdminSessionValue(sessionCookie)) {
      return NextResponse.json({ ok: false, message: "Admin girişi gerekli." }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, message: "Dosya bulunamadı." }, { status: 400 });
    }

    if (!allowedMimePrefixes.some((prefix) => file.type.startsWith(prefix))) {
      return NextResponse.json({ ok: false, message: "Sadece görsel veya video dosyası yüklenebilir." }, { status: 400 });
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ ok: false, message: "Dosya çok büyük. En fazla 30 MB yüklenebilir." }, { status: 400 });
    }

    const config = getSupabaseConfig();
    if (!config) {
      return NextResponse.json({ ok: false, message: "Supabase yapılandırması eksik." }, { status: 503 });
    }

    const objectPath = createObjectPath(file.name);
    const uploadUrl = `${config.supabaseUrl}/storage/v1/object/${STORAGE_BUCKET}/${objectPath}`;
    const uploadResponse = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        apikey: config.serviceRoleKey,
        Authorization: `Bearer ${config.serviceRoleKey}`,
        "Content-Type": file.type,
        "x-upsert": "false",
      },
      body: new Uint8Array(await file.arrayBuffer()),
    });

    if (!uploadResponse.ok) {
      return NextResponse.json({ ok: false, message: "Dosya yüklenemedi." }, { status: 500 });
    }

    const publicUrl = `${config.supabaseUrl}/storage/v1/object/public/${STORAGE_BUCKET}/${objectPath}`;
    const verifyResponse = await fetch(publicUrl, {
      method: "HEAD",
      cache: "no-store",
    });

    if (!verifyResponse.ok) {
      return NextResponse.json(
        { ok: false, message: "Dosya yüklendi ancak public erişim doğrulanamadı. Bucket izinlerini kontrol edin." },
        { status: 502 },
      );
    }

    return NextResponse.json({
      ok: true,
      path: publicUrl,
      mediaType: file.type.startsWith("video/") ? "video" : "image",
    });
  } catch {
    return NextResponse.json({ ok: false, message: "Dosya yüklenemedi." }, { status: 500 });
  }
}
