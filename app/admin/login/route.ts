import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const form = await req.formData();
  const password = String(form.get("password") ?? "");

  const real = process.env.ADMIN_PASSWORD ?? "";

  if (!real) {
    return NextResponse.json(
      { error: "ADMIN_PASSWORD not set in .env.local" },
      { status: 500 }
    );
  }

  if (password !== real) {
    return NextResponse.redirect(new URL("/admin", req.url));
  }

  const res = NextResponse.redirect(new URL("/admin", req.url));
  res.cookies.set("admin_auth", "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  return res;
}
