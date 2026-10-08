import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/authorization";
import { chatWithAI, ChatMessage } from "@/lib/ai";
import { prisma } from "@/lib/prisma";

const CONTEXT_MESSAGES = 20;
const HISTORY_LIMIT = 50;
const MAX_CONTENT_LENGTH = 1000;

function toRole(role: "USER" | "ASSISTANT"): "user" | "assistant" {
  return role === "USER" ? "user" : "assistant";
}

// ==========================================
// GET HISTORY
// ==========================================
export async function GET() {
  const { session, status } = await requireAuth();

  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status });
  }

  const rows = await prisma.chatMessage.findMany({
    where: { userId: Number(session.user.id) },
    orderBy: { id: "desc" },
    take: HISTORY_LIMIT,
  });

  const messages = rows.reverse().map((m) => ({
    role: toRole(m.role),
    content: m.content,
  }));

  return NextResponse.json({ messages });
}

// ==========================================
// POST CHAT
// ==========================================
export async function POST(request: Request) {
  try {
    const { session, status } = await requireAuth();

    if (!session) {
      return NextResponse.json({ error: "No autenticado" }, { status });
    }

    const userId = Number(session.user.id);
    const body = await request.json();
    const text = typeof body?.message === "string" ? body.message.trim().slice(0, MAX_CONTENT_LENGTH) : "";

    if (!text) {
      return NextResponse.json({ error: "message es requerido" }, { status: 400 });
    }

    const previous = await prisma.chatMessage.findMany({
      where: { userId },
      orderBy: { id: "desc" },
      take: CONTEXT_MESSAGES - 1,
    });

    const history: ChatMessage[] = previous.reverse().map((m) => ({
      role: toRole(m.role),
      content: m.content,
    }));

    while (history.length > 0 && history[0].role !== "user") {
      history.shift();
    }

    const reply = await chatWithAI([...history, { role: "user", content: text }], userId);

    await prisma.chatMessage.createMany({
      data: [
        { userId, role: "USER", content: text },
        { userId, role: "ASSISTANT", content: reply },
      ],
    });

    return NextResponse.json({ reply }, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message === "RATE_LIMIT") {
      return NextResponse.json(
        { error: "El asistente esta muy ocupado, intenta de nuevo en unos segundos" },
        { status: 429 }
      );
    }

    console.error("Error en POST /api/chat:", error);

    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// ==========================================
// DELETE HISTORY
// ==========================================
export async function DELETE() {
  const { session, status } = await requireAuth();

  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status });
  }

  await prisma.chatMessage.deleteMany({
    where: { userId: Number(session.user.id) },
  });

  return NextResponse.json({ ok: true });
}