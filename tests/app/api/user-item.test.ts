import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  userFindUnique: vi.fn(),
  userUpdate: vi.fn(),
  userCount: vi.fn(),
  userDelete: vi.fn(),
  collectionFindMany: vi.fn(),
  collectionFindFirst: vi.fn(),
  collectionDelete: vi.fn(),
  pokemonDelete: vi.fn(),
  transaction: vi.fn(),
  hashPassword: vi.fn(),
  requireProfessor: vi.fn(),
}));

const transactionClient = {
  user: { delete: mocks.userDelete },
  collection: {
    findMany: mocks.collectionFindMany,
    findFirst: mocks.collectionFindFirst,
    delete: mocks.collectionDelete,
  },
  pokemon: { delete: mocks.pokemonDelete },
};

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: mocks.userFindUnique,
      update: mocks.userUpdate,
      count: mocks.userCount,
    },
    $transaction: mocks.transaction,
  },
}));
vi.mock("@/lib/password", () => ({ hashPassword: mocks.hashPassword }));
vi.mock("@/lib/authorization", () => ({ requireProfessor: mocks.requireProfessor }));

import { DELETE, GET, PATCH } from "@/app/api/user/[id]/route";

const professorSession = { user: { id: "1", name: "Professor Oak", role: "PROFESSOR" } };
const context = (id: string) => ({ params: Promise.resolve({ id }) });
const request = (method: string, body?: unknown) =>
  new Request("http://localhost/api/user/2", {
    method,
    headers: { "Content-Type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });

describe("/api/user/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireProfessor.mockResolvedValue({ session: professorSession, status: 200 });
    mocks.userFindUnique.mockResolvedValue({
      id: 2,
      name: "Misty",
      role: "TRAINER",
      password: "existing-hash",
    });
    mocks.transaction.mockImplementation((callback) => callback(transactionClient));
    mocks.collectionFindMany.mockResolvedValue([]);
    mocks.collectionFindFirst.mockResolvedValue(null);
  });

  it("rejects unauthenticated and invalid-id user lookups", async () => {
    mocks.requireProfessor.mockResolvedValueOnce({ session: null, status: 401 });
    expect((await GET(request("GET"), context("2"))).status).toBe(401);

    expect((await GET(request("GET"), context("0"))).status).toBe(400);
    expect(mocks.userFindUnique).not.toHaveBeenCalled();
  });

  it("returns a selected user without exposing the password", async () => {
    const user = { id: 2, name: "Misty", role: "TRAINER", createdAt: "2026-01-01" };
    mocks.userFindUnique.mockResolvedValue(user);

    const response = await GET(request("GET"), context("2"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(user);
    expect(mocks.userFindUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 2 },
        select: { id: true, name: true, role: true, createdAt: true },
      }),
    );
  });

  it("returns 404 for an unknown user and 500 for database failures", async () => {
    mocks.userFindUnique.mockResolvedValueOnce(null);
    expect((await GET(request("GET"), context("2"))).status).toBe(404);

    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.userFindUnique.mockRejectedValueOnce(new Error("database unavailable"));
    expect((await GET(request("GET"), context("2"))).status).toBe(500);
  });

  it("validates IDs, role values, and self-role changes before updating", async () => {
    expect((await PATCH(request("PATCH", { name: "X" }), context("invalid"))).status).toBe(400);
    expect((await PATCH(request("PATCH", { role: "ADMIN" }), context("2"))).status).toBe(400);

    mocks.requireProfessor.mockResolvedValue({
      session: { user: { id: "1", name: "Oak", role: "PROFESSOR" } },
      status: 200,
    });
    expect((await PATCH(request("PATCH", { role: "TRAINER" }), context("1"))).status).toBe(403);
    expect(mocks.userUpdate).not.toHaveBeenCalled();
  });

  it("updates profile fields and hashes a new password", async () => {
    mocks.hashPassword.mockResolvedValue("new-hash");
    const updated = { id: 2, name: "Misty updated", role: "TRAINER" };
    mocks.userUpdate.mockResolvedValue(updated);

    const response = await PATCH(
      request("PATCH", { name: "Misty updated", password: "new-password" }),
      context("2"),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(updated);
    expect(mocks.hashPassword).toHaveBeenCalledWith("new-password");
    expect(mocks.userUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 2 },
        data: { name: "Misty updated", password: "new-hash" },
      }),
    );
  });

  it("does not require a password when changing another user's role", async () => {
    mocks.userUpdate.mockResolvedValue({ id: 2, role: "PROFESSOR" });

    const response = await PATCH(request("PATCH", { role: "PROFESSOR" }), context("2"));

    expect(response.status).toBe(200);
    expect(mocks.hashPassword).not.toHaveBeenCalled();
    expect(mocks.userUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: { role: "PROFESSOR" } }),
    );
  });

  it("returns 404 when updating a missing user and 500 on database errors", async () => {
    mocks.userFindUnique.mockResolvedValueOnce(null);
    expect((await PATCH(request("PATCH", { name: "X" }), context("2"))).status).toBe(404);

    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.userFindUnique.mockRejectedValueOnce(new Error("database unavailable"));
    expect((await PATCH(request("PATCH", { name: "X" }), context("2"))).status).toBe(500);
  });

  it("rejects invalid IDs, missing users, and self-deletion", async () => {
    expect((await DELETE(request("DELETE"), context("-1"))).status).toBe(400);

    mocks.userFindUnique.mockResolvedValueOnce(null);
    expect((await DELETE(request("DELETE"), context("2"))).status).toBe(404);

    mocks.requireProfessor.mockResolvedValue({
      session: { user: { id: "2", name: "Misty", role: "PROFESSOR" } },
      status: 200,
    });
    expect((await DELETE(request("DELETE"), context("2"))).status).toBe(403);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("prevents deleting the last professor", async () => {
    mocks.userFindUnique.mockResolvedValue({ id: 2, role: "PROFESSOR" });
    mocks.userCount.mockResolvedValue(1);

    const response = await DELETE(request("DELETE"), context("2"));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toHaveProperty(
      "error",
      "No se puede eliminar al ultimo PROFESSOR",
    );
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("deletes a user transactionally and only removes unreferenced Pokémon", async () => {
    mocks.userFindUnique.mockResolvedValue({ id: 2, role: "TRAINER" });
    mocks.collectionFindMany.mockResolvedValue([{ pokemonId: 25 }, { pokemonId: 26 }]);
    mocks.collectionFindFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 10, userId: 3 });

    const response = await DELETE(request("DELETE"), context("2"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ message: "Usuario eliminado" });
    expect(mocks.transaction).toHaveBeenCalledOnce();
    expect(mocks.userDelete).toHaveBeenCalledWith({ where: { id: 2 } });
    expect(mocks.pokemonDelete).toHaveBeenCalledOnce();
    expect(mocks.pokemonDelete).toHaveBeenCalledWith({ where: { id: 25 } });
  });

  it("returns 500 when transactional deletion fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.userFindUnique.mockResolvedValue({ id: 2, role: "TRAINER" });
    mocks.transaction.mockRejectedValue(new Error("database unavailable"));

    const response = await DELETE(request("DELETE"), context("2"));

    expect(response.status).toBe(500);
  });
});
