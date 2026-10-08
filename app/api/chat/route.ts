import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/authorization";
import { chatWithAI, ChatMessage } from "@/lib/ai";

const MAX_MESSAGES = 20;
const MAX_CONTENT_LENGTH = 1000;

// ==========================================
// POST CHAT
// ==========================================
export async function POST(request: Request) {
  try {
    const authResult = await requireAuth();

    if (!authResult.session) {
      return NextResponse.json(
        {
          error: "No autenticado",
        },
        {
          status: authResult.status,
        }
      );
    }

    const userId = Number(authResult.session.user.id);
    const body = await request.json();
    const { messages } = body;

    // ==========================================
    // VALIDATION
    // ==========================================
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        {
          error: "messages es requerido",
        }, { status: 400 }
      );
    }

    const validMessages: ChatMessage[] = messages.slice(-MAX_MESSAGES).filter(
        (m) =>
          (m?.role === "user" || m?.role === "assistant") && typeof m?.content === "string" && m.content.trim().length > 0
      )
      .map((m) => ({
        role: m.role,
        content: m.content.trim().slice(0, MAX_CONTENT_LENGTH),
      }));

    if (validMessages.length === 0 || validMessages[validMessages.length - 1].role !== "user") {
      return NextResponse.json(
        {
          error: "El ultimo mensaje debe ser del usuario",
        }, { status: 400 }
      );
    }

    // ==========================================
    // AI RESPONSE
    // ==========================================
    const reply = await chatWithAI(validMessages, userId);

    return NextResponse.json(
      { reply },
      { status: 200 }
    );

  } catch (error) {

    if (error instanceof Error && error.message === "RATE_LIMIT") {
      return NextResponse.json(
        {
          error: "El asistente esta muy ocupado, intenta de nuevo en unos segundos",
        }, { status: 429 }
      );
    }

    console.error("Error en POST /api/chat:", error);

    return NextResponse.json(
      {
        error: "Error interno del servidor",
      }, { status: 500 }
    );
  }
}