import { cookies } from "next/headers";
import crypto from "node:crypto";
import { prisma } from "./prisma";

const SESSION_COOKIE = "session";

function hmac(data: string) {
  const secret = process.env.AUTH_SECRET || "";
  return crypto.createHmac("sha256", secret).update(data).digest("hex");
}

export function createSessionValue(userId: string, email: string) {
  const payload = `${userId}|${email}`;
  const sig = hmac(payload);
  return Buffer.from(`${payload}|${sig}`).toString("base64url");
}

export function parseSessionValue(value: string | undefined) {
  if (!value) return null;
  try {
    const decoded = Buffer.from(value, "base64url").toString("utf8");
    const [userId, email, sig] = decoded.split("|");
    if (!userId || !email || !sig) return null;
    const ok = hmac(`${userId}|${email}`) === sig;
    if (!ok) return null;
    return { userId, email };
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;
  const session = parseSessionValue(raw);
  if (!session) return null;
  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) return null;
  return user;
}

export const authCookieName = SESSION_COOKIE;

