import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  deleteMany: vi.fn(),
  findMany: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    userMemory: {
      create: mocks.create,
      deleteMany: mocks.deleteMany,
      findMany: mocks.findMany,
    },
  },
}));

import {
  clearUserMemories,
  deleteUserMemory,
  getUserMemories,
  saveUserMemory,
} from "@/lib/memory";

describe("user memories", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findMany.mockResolvedValue([]);
  });

  it("loads only the selected user's memory fields in stable order", async () => {
    const memories = [{ id: 1, category: "FACT", content: "Completar Kanto" }];
    mocks.findMany.mockResolvedValue(memories);

    await expect(getUserMemories(12)).resolves.toEqual(memories);
    expect(mocks.findMany).toHaveBeenCalledWith({
      where: { userId: 12 },
      orderBy: { id: "asc" },
      select: { id: true, category: true, content: true },
    });
  });

  it("trims and truncates a saved memory while preserving its category", async () => {
    const saved = { id: 5, category: "PREFERENCE", content: "x".repeat(300) };
    mocks.create.mockResolvedValue(saved);

    await expect(
      saveUserMemory(12, `  ${"x".repeat(350)}  `, "PREFERENCE"),
    ).resolves.toEqual({ saved: true, memory: saved });
    expect(mocks.create).toHaveBeenCalledWith({
      data: { userId: 12, category: "PREFERENCE", content: "x".repeat(300) },
      select: { id: true, category: true, content: true },
    });
  });

  it("rejects blank and duplicate memories without inserting", async () => {
    mocks.findMany.mockResolvedValue([
      { id: 1, category: "PREFERENCE", content: "Tipo favorito: agua" },
    ]);

    await expect(saveUserMemory(12, "   ")).resolves.toEqual({
      error: "memory es requerido",
    });
    await expect(saveUserMemory(12, " tipo favorito: AGUA ")).resolves.toEqual({
      saved: false,
      reason: "Ya estaba guardado",
    });
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("enforces the per-user memory cap", async () => {
    mocks.findMany.mockResolvedValue(
      Array.from({ length: 30 }, (_, index) => ({
        id: index + 1,
        category: "FACT",
        content: `memory ${index}`,
      })),
    );

    await expect(saveUserMemory(12, "un nuevo recuerdo")).resolves.toHaveProperty(
      "error",
      "La memoria esta llena. Usa forget_memory para borrar algo menos importante antes de guardar.",
    );
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("deletes a memory only when it belongs to the requested user", async () => {
    mocks.deleteMany.mockResolvedValue({ count: 0 });

    await expect(deleteUserMemory(12, 9)).resolves.toEqual({ deleted: false });
    expect(mocks.deleteMany).toHaveBeenCalledWith({ where: { id: 9, userId: 12 } });
  });

  it("clears only memories owned by the requested user", async () => {
    mocks.deleteMany.mockResolvedValue({ count: 2 });

    await clearUserMemories(12);

    expect(mocks.deleteMany).toHaveBeenCalledWith({ where: { userId: 12 } });
  });

  it("propagates database errors instead of returning a success-shaped fallback", async () => {
    mocks.findMany.mockRejectedValue(new Error("database unavailable"));

    await expect(getUserMemories(12)).rejects.toThrow("database unavailable");
  });
});
