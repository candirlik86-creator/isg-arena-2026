import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, getCookieValue, isValidAdminSessionValue } from "@/lib/admin-auth";

export const runtime = "nodejs";

const MAX_UPLOAD_BYTES = 30 * 1024 * 1024;
const allowedMimePrefixes = ["image/", "video/"];

function sanitizeFileName(name: string) {
  const extension = path.extname(name).toLowerCase();
  const baseName = path
    .basename(name, extension)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${baseName || "media"}${extension}`;
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

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });

    const fileName = sanitizeFileName(file.name);
    const filePath = path.join(uploadsDir, fileName);
    const bytes = new Uint8Array(await file.arrayBuffer());
    await writeFile(filePath, bytes);

    return NextResponse.json({
      ok: true,
      path: `/uploads/${fileName}`,
      mediaType: file.type.startsWith("video/") ? "video" : "image",
    });
  } catch {
    return NextResponse.json({ ok: false, message: "Dosya yüklenemedi." }, { status: 500 });
  }
}
