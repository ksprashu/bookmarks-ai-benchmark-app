import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authCookieName, createSessionValue } from "@/lib/auth";

export async function POST(req: Request) {
  const { email, name } = await req.json().catch(() => ({ email: "", name: "" }));
  if (!email || typeof email !== "string" || !email.includes("@")) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, name: name && typeof name === "string" ? name : null },
  });
  const session = createSessionValue(user.id, user.email);
  const res = NextResponse.json({ ok: true }, { status: 200 });
  res.headers.set(
    "Set-Cookie",
    `${authCookieName}=${session}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}`
  );
  return res;
}
