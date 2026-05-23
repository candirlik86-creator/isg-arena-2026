import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, createAdminSessionCookieValue, getAdminSessionCookieOptions, isAdminPassword } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const formData = await request.formData();
  const password = String(formData.get("password") ?? "");
  const redirectUrl = new URL("/admin", request.url);

  if (!isAdminPassword(password)) {
    redirectUrl.searchParams.set("error", "1");
    return NextResponse.redirect(redirectUrl, { status: 303 });
  }

  const response = NextResponse.redirect(redirectUrl, { status: 303 });
  response.cookies.set(ADMIN_SESSION_COOKIE, createAdminSessionCookieValue(), getAdminSessionCookieOptions());
  return response;
}
