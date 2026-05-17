import { NextResponse } from "next/server";

// Paths that don't require authentication
const OPEN = ["/admin/login", "/api/admin/login", "/api/admin/logout"];

// Compute expected session token using Web Crypto (Edge Runtime compatible)
async function expectedToken() {
  const input = (process.env.ADMIN_PASSWORD ?? "") + (process.env.ADMIN_SECRET ?? "");
  const buf   = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  if (OPEN.includes(pathname)) return NextResponse.next();

  const session  = request.cookies.get("admin_session")?.value;
  const expected = await expectedToken();

  if (session !== expected) {
    const login = new URL("/admin/login", request.url);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
