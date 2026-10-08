import { chatTools, executeChatTool } from "@/lib/chatTools";

const AI_API_URL = process.env.AI_API_URL!;
const AI_API_KEY = process.env.AI_API_KEY!;
const AI_MODEL = process.env.AI_MODEL || "gemini-3.5-flash";

const MAX_TOOL_ITERATIONS = 5;

const SYSTEM_PROMPT = `
Eres el asistente de PokeDex Manager, una aplicacion para gestionar colecciones de Pokemon.

Responde siempre en el mismo idioma del usuario, de forma amable y concisa.

Reglas:
- Para hablar de la coleccion del usuario, usa SIEMPRE get_my_collection. Nunca supongas que Pokemon tiene.
- Para datos de un Pokemon (tipos, habilidades, tamaño), usa get_pokemon_info. No inventes datos.
- Para recomendar Pokemon, revisa primero la coleccion (get_my_collection), detecta los tipos que le faltan o tiene poco representados y usa get_pokemon_by_type para proponer candidatos que NO tenga. Explica brevemente por que cada sugerencia le es util.
- Los nombres de Pokemon y tipos en las herramientas van en ingles; al responder puedes usar el idioma del usuario.
- Si la pregunta no tiene relacion con Pokemon o con la aplicacion, indica amablemente que solo puedes ayudar con eso.
- Puedes usar markdown simple (negritas, listas con guiones). Evita tablas y encabezados grandes, y mantén las respuestas cortas.
`;

// ------------------------------------------
// TYPES
// ------------------------------------------
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

interface AIMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
}

// ==========================================
// CHAT WITH AI
// ==========================================
export async function chatWithAI(messages: ChatMessage[], userId:number): Promise<string> {
  const conversation: AIMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...messages,
  ];

  for (let i = 0; i < MAX_TOOL_ITERATIONS; i++) {
    const response = await fetch(AI_API_URL, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${AI_API_KEY}`,
      },

      body: JSON.stringify({
        model: AI_MODEL,
        messages: conversation,
        tools: chatTools,
        tool_choice: "auto",
        temperature: 0.4,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error("RATE_LIMIT");
      }

      const detail = await response.text();

      if (response.status === 404 || response.status === 400) {
        console.error(
          `El modelo rechazo la peticion. Revisa AI_MODEL (${AI_MODEL}) con scripts/list-models.mjs:`,
          detail
        );
      }

      throw new Error(`Error al consultar la IA (${response.status}): ${detail}`);
    }

    const data = await response.json();
    const message: AIMessage = data.choices[0].message;

    if (!message.tool_calls || message.tool_calls.length === 0) {
      return message.content ?? "";
    }

    conversation.push({
      role: "assistant",
      content: message.content ?? null,
      tool_calls: message.tool_calls,
    });

    for (const toolCall of message.tool_calls) {
      let args: Record<string, unknown> = {};

      try {
        args = JSON.parse(toolCall.function.arguments || "{}");
      } catch {
        args = {};
      }

      const result = await executeChatTool(toolCall.function.name, args, userId);

      conversation.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: JSON.stringify(result),
      });
    }
  }

  return "No pude completar la consulta, intenta reformular tu pregunta.";
}