import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const res = NextResponse.redirect(new URL("/admin", req.url));
  res.cookies.set("admin_auth", "", { path: "/", maxAge: 0 });
  return res;
}
