import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUserMemories: vi.fn(),
  clearUserMemories: vi.fn(),
  requireAuth: vi.fn(),
}));

vi.mock("@/lib/memory", () => ({
  getUserMemories: mocks.getUserMemories,
  clearUserMemories: mocks.clearUserMemories,
}));
vi.mock("@/lib/authorization", () => ({ requireAuth: mocks.requireAuth }));

import { DELETE, GET } from "@/app/api/chat/memory/route";

describe("/api/chat/memory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAuth.mockResolvedValue({
      session: { user: { id: "17", role: "TRAINER" } },
      status: 200,
    });
  });

  it("requires authentication before reading or clearing memories", async () => {
    mocks.requireAuth.mockResolvedValue({ session: null, status: 401 });

    expect((await GET()).status).toBe(401);
    expect((await DELETE()).status).toBe(401);
    expect(mocks.getUserMemories).not.toHaveBeenCalled();
    expect(mocks.clearUserMemories).not.toHaveBeenCalled();
  });

  it("returns memories belonging to the signed-in user", async () => {
    const memories = [{ id: 3, category: "FACT", content: "Completar Kanto" }];
    mocks.getUserMemories.mockResolvedValue(memories);

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ memories });
    expect(mocks.getUserMemories).toHaveBeenCalledWith(17);
  });

  it("clears only the signed-in user's memories", async () => {
    mocks.clearUserMemories.mockResolvedValue(undefined);

    const response = await DELETE();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(mocks.clearUserMemories).toHaveBeenCalledWith(17);
  });

  it("propagates memory-service failures", async () => {
    mocks.getUserMemories.mockRejectedValue(new Error("database unavailable"));

    await expect(GET()).rejects.toThrow("database unavailable");
  });
});
