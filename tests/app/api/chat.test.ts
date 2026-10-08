import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  chatWithAI: vi.fn(),
  chatFindMany: vi.fn(),
  chatCreateMany: vi.fn(),
  chatDeleteMany: vi.fn(),
  requireAuth: vi.fn(),
}));

vi.mock("@/lib/ai", () => ({ chatWithAI: mocks.chatWithAI }));
vi.mock("@/lib/authorization", () => ({ requireAuth: mocks.requireAuth }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    chatMessage: {
      findMany: mocks.chatFindMany,
      createMany: mocks.chatCreateMany,
      deleteMany: mocks.chatDeleteMany,
    },
  },
}));

import { DELETE, GET, POST } from "@/app/api/chat/route";

const session = { user: { id: "21", name: "Brock", role: "TRAINER" } };

describe("/api/chat", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAuth.mockResolvedValue({ session, status: 200 });
    mocks.chatFindMany.mockResolvedValue([]);
    mocks.chatCreateMany.mockResolvedValue({ count: 2 });
  });

  it("requires authentication to load history", async () => {
    mocks.requireAuth.mockResolvedValue({ session: null, status: 401 });

    const response = await GET();

    expect(response.status).toBe(401);
    expect(mocks.chatFindMany).not.toHaveBeenCalled();
  });

  it("returns the current user's messages in chronological order", async () => {
    mocks.chatFindMany.mockResolvedValue([
      { id: 2, role: "ASSISTANT", content: "Hola" },
      { id: 1, role: "USER", content: "Buenas" },
    ]);

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      messages: [
        { role: "user", content: "Buenas" },
        { role: "assistant", content: "Hola" },
      ],
    });
    expect(mocks.chatFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 21 }, take: 50 }),
    );
  });

  it.each([undefined, "", "   ", 42])("rejects invalid message content: %s", async (message) => {
    const response = await POST(
      new Request("http://localhost/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      }),
    );

    expect(response.status).toBe(400);
    expect(mocks.chatWithAI).not.toHaveBeenCalled();
    expect(mocks.chatCreateMany).not.toHaveBeenCalled();
  });

  it("trims and bounds input, sends recent context to the AI, and persists both messages", async () => {
    mocks.chatFindMany.mockResolvedValue([
      { id: 2, role: "ASSISTANT", content: "Pikachu es eléctrico." },
      { id: 1, role: "USER", content: "¿Qué tipo es Pikachu?" },
    ]);
    mocks.chatWithAI.mockResolvedValue("Mide 0.4 m.");

    const response = await POST(
      new Request("http://localhost/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: `  ${"a".repeat(1100)}  ` }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ reply: "Mide 0.4 m." });
    expect(mocks.chatWithAI).toHaveBeenCalledWith(
      [
        { role: "user", content: "¿Qué tipo es Pikachu?" },
        { role: "assistant", content: "Pikachu es eléctrico." },
        { role: "user", content: "a".repeat(1000) },
      ],
      21,
    );
    expect(mocks.chatCreateMany).toHaveBeenCalledWith({
      data: [
        { userId: 21, role: "USER", content: "a".repeat(1000) },
        { userId: 21, role: "ASSISTANT", content: "Mide 0.4 m." },
      ],
    });
  });

  it("converts provider rate limits into a retryable response", async () => {
    mocks.chatWithAI.mockRejectedValue(new Error("RATE_LIMIT"));

    const response = await POST(
      new Request("http://localhost/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "¿Qué tipo es Pikachu?" }),
      }),
    );

    expect(response.status).toBe(429);
    expect(mocks.chatCreateMany).not.toHaveBeenCalled();
  });

  it("returns 500 for chat storage failures", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.chatFindMany.mockRejectedValue(new Error("database unavailable"));

    const response = await POST(
      new Request("http://localhost/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Hola" }),
      }),
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toHaveProperty("error", "Error interno del servidor");
  });

  it("clears only the authenticated user's history", async () => {
    mocks.chatDeleteMany.mockResolvedValue({ count: 2 });

    const response = await DELETE();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(mocks.chatDeleteMany).toHaveBeenCalledWith({ where: { userId: 21 } });
  });
});
