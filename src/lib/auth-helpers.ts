import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function requireAuth() {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      authenticated: false as const,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return {
    authenticated: true as const,
    userId: session.user.id,
    session,
  };
}
