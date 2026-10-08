import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/authorization";
import { getUserMemories, clearUserMemories } from "@/lib/memory";

export async function GET() {
  const { session, status } = await requireAuth();

  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status });
  }

  const memories = await getUserMemories(Number(session.user.id));

  return NextResponse.json({ memories });
}

export async function DELETE() {
  const { session, status } = await requireAuth();

  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status });
  }

  await clearUserMemories(Number(session.user.id));

  return NextResponse.json({ ok: true });
}