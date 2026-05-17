import { NextResponse } from "next/server";
import crypto from "crypto";

function computeToken() {
  const input = (process.env.ADMIN_PASSWORD ?? "") + (process.env.ADMIN_SECRET ?? "");
  return crypto.createHash("sha256").update(input).digest("hex");
}

export async function POST(req) {
  const { password } = await req.json();

  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  const res = NextResponse.json({ success: true });
  res.cookies.set("admin_session", computeToken(), {
    httpOnly: true,
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}
