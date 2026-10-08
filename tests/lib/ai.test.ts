import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  executeChatTool: vi.fn(),
  getUserMemories: vi.fn(),
}));

vi.mock("@/lib/chatTools", () => ({
  chatTools: [],
  executeChatTool: mocks.executeChatTool,
}));
vi.mock("@/lib/memory", () => ({ getUserMemories: mocks.getUserMemories }));

let chatWithAI: typeof import("@/lib/ai").chatWithAI;

beforeAll(async () => {
  vi.stubEnv("AI_API_URL", "https://ai.example.test/v1/chat/completions");
  vi.stubEnv("AI_API_KEY", "test-only-key");
  vi.stubEnv("AI_MODEL", "test-model");
  ({ chatWithAI } = await import("@/lib/ai"));
});

afterAll(() => vi.unstubAllEnvs());
afterEach(() => vi.unstubAllGlobals());

describe("chatWithAI", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getUserMemories.mockResolvedValue([]);
  });

  it("sends the configured model, key, messages, and system instructions", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({ choices: [{ message: { role: "assistant", content: "¡Hola!" } }] }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(chatWithAI([{ role: "user", content: "Hola" }], 12)).resolves.toBe("¡Hola!");

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://ai.example.test/v1/chat/completions");
    expect(new Headers(options.headers).get("Authorization")).toBe("Bearer test-only-key");
    const body = JSON.parse(String(options.body));
    expect(body.model).toBe("test-model");
    expect(body.temperature).toBe(0.4);
    expect(body.messages[0].content).toContain("Recuerdos del usuario: (ninguno todavia)");
    expect(body.messages.at(-1)).toEqual({ role: "user", content: "Hola" });
    expect(mocks.getUserMemories).toHaveBeenCalledWith(12);
  });

  it("includes user-specific memories in the system context", async () => {
    mocks.getUserMemories.mockResolvedValue([
      { id: 4, category: "PREFERENCE", content: "Prefiere tipo agua" },
    ]);
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({ choices: [{ message: { role: "assistant", content: "Entendido." } }] }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await chatWithAI([{ role: "user", content: "Recomiéndame algo" }], 12);

    const body = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    expect(body.messages[0].content).toContain(
      "- [id 4] (PREFERENCE) Prefiere tipo agua",
    );
  });

  it("executes tool calls and sends the result back to the model", async () => {
    const toolCall = {
      id: "call-1",
      type: "function",
      function: { name: "get_pokemon_info", arguments: '{"pokemon":"pikachu"}' },
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({
          choices: [
            {
              message: {
                role: "assistant",
                content: null,
                tool_calls: [toolCall],
              },
            },
          ],
        }),
      )
      .mockResolvedValueOnce(
        Response.json({ choices: [{ message: { role: "assistant", content: "Es eléctrico." } }] }),
      );
    vi.stubGlobal("fetch", fetchMock);
    mocks.executeChatTool.mockResolvedValue({ id: 25, types: ["electric"] });

    await expect(chatWithAI([{ role: "user", content: "Pikachu" }], 12)).resolves.toBe(
      "Es eléctrico.",
    );
    expect(mocks.executeChatTool).toHaveBeenCalledWith(
      "get_pokemon_info",
      { pokemon: "pikachu" },
      12,
    );
    const followUp = JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body));
    expect(followUp.messages.at(-1)).toEqual({
      role: "tool",
      tool_call_id: "call-1",
      content: JSON.stringify({ id: 25, types: ["electric"] }),
    });
  });

  it("uses empty arguments when tool arguments are malformed", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({
          choices: [
            {
              message: {
                role: "assistant",
                content: null,
                tool_calls: [
                  {
                    id: "call-bad-json",
                    type: "function",
                    function: { name: "get_my_collection", arguments: "{" },
                  },
                ],
              },
            },
          ],
        }),
      )
      .mockResolvedValueOnce(
        Response.json({ choices: [{ message: { role: "assistant", content: "Sin colección." } }] }),
      );
    vi.stubGlobal("fetch", fetchMock);

    await chatWithAI([{ role: "user", content: "Mi equipo" }], 12);

    expect(mocks.executeChatTool).toHaveBeenCalledWith("get_my_collection", {}, 12);
  });

  it("returns an empty string when the provider response has no text", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json({ choices: [{ message: { content: null } }] })),
    );

    await expect(chatWithAI([{ role: "user", content: "Hola" }], 12)).resolves.toBe("");
  });

  it("maps HTTP 429 to the caller's rate-limit sentinel", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("busy", { status: 429 })));

    await expect(chatWithAI([{ role: "user", content: "Hola" }], 12)).rejects.toThrow(
      "RATE_LIMIT",
    );
  });

  it("surfaces other provider errors, including the returned detail", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("provider failed", { status: 502 })));

    await expect(chatWithAI([{ role: "user", content: "Hola" }], 12)).rejects.toThrow(
      "Error al consultar la IA (502): provider failed",
    );
  });

  it("logs model configuration errors for a 400 response", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("invalid model", { status: 400 })));

    await expect(chatWithAI([{ role: "user", content: "Hola" }], 12)).rejects.toThrow(
      "Error al consultar la IA (400): invalid model",
    );
    expect(console.error).toHaveBeenCalledOnce();
  });

  it("stops after the configured maximum number of tool iterations", async () => {
    const responseWithTool = () =>
      Response.json({
        choices: [
          {
            message: {
              role: "assistant",
              content: null,
              tool_calls: [
                {
                  id: `call-${Math.random()}`,
                  type: "function",
                  function: { name: "get_my_collection", arguments: "{}" },
                },
              ],
            },
          },
        ],
      });
    const fetchMock = vi.fn().mockImplementation(responseWithTool);
    vi.stubGlobal("fetch", fetchMock);

    await expect(chatWithAI([{ role: "user", content: "Mi colección" }], 12)).resolves.toBe(
      "No pude completar la consulta, intenta reformular tu pregunta.",
    );
    expect(fetchMock).toHaveBeenCalledTimes(5);
    expect(mocks.executeChatTool).toHaveBeenCalledTimes(5);
  });
});
