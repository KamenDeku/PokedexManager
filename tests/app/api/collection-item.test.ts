import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findUnique: vi.fn(),
  update: vi.fn(),
  collectionDelete: vi.fn(),
  collectionFindFirst: vi.fn(),
  pokemonDelete: vi.fn(),
  transaction: vi.fn(),
  requireAuth: vi.fn(),
  requireProfessor: vi.fn(),
}));

const transactionClient = {
  collection: {
    delete: mocks.collectionDelete,
    findFirst: mocks.collectionFindFirst,
  },
  pokemon: { delete: mocks.pokemonDelete },
};

vi.mock("@/lib/prisma", () => ({
  prisma: {
    collection: {
      findUnique: mocks.findUnique,
      update: mocks.update,
    },
    $transaction: mocks.transaction,
  },
}));
vi.mock("@/lib/authorization", () => ({
  requireAuth: mocks.requireAuth,
  requireProfessor: mocks.requireProfessor,
}));

import { DELETE, PATCH } from "@/app/api/collection/[id]/route";

const trainerSession = { user: { id: "7", name: "Misty", role: "TRAINER" } };
const routeContext = { params: Promise.resolve({ id: "4" }) };

describe("PATCH /api/collection/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAuth.mockResolvedValue({ session: trainerSession, status: 200 });
    mocks.requireProfessor.mockResolvedValue({ session: trainerSession, status: 200 });
    mocks.findUnique.mockResolvedValue({ id: 4, userId: 7, pokemonId: 25 });
    mocks.transaction.mockImplementation((callback) => callback(transactionClient));
    mocks.collectionFindFirst.mockResolvedValue(null);
  });

  it("rejects invalid collection IDs and statuses", async () => {
    const invalidId = await PATCH(
      new Request("http://localhost/api/collection/0", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "RELEASED" }),
      }),
      { params: Promise.resolve({ id: "0" }) },
    );
    expect(invalidId.status).toBe(400);
    expect(mocks.findUnique).not.toHaveBeenCalled();

    const invalidStatus = await PATCH(
      new Request("http://localhost/api/collection/4", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "NOT_CAUGHT" }),
      }),
      routeContext,
    );
    expect(invalidStatus.status).toBe(400);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("prevents a trainer from modifying another user's collection entry", async () => {
    mocks.findUnique.mockResolvedValue({ id: 4, userId: 8, pokemonId: 25 });

    const response = await PATCH(
      new Request("http://localhost/api/collection/4", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "RELEASED" }),
      }),
      routeContext,
    );

    expect(response.status).toBe(403);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("updates the owner's collection status", async () => {
    const updated = {
      id: 4,
      userId: 7,
      status: "RELEASED",
      pokemon: { pokeApiId: 25, name: "pikachu" },
    };
    mocks.update.mockResolvedValue(updated);

    const response = await PATCH(
      new Request("http://localhost/api/collection/4", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "RELEASED" }),
      }),
      routeContext,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(updated);
    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 4 },
        data: { status: "RELEASED" },
      }),
    );
  });

  it("reports database failures without exposing internal details", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.findUnique.mockRejectedValue(new Error("database unavailable"));

    const response = await PATCH(
      new Request("http://localhost/api/collection/4", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CAUGHT" }),
      }),
      routeContext,
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toHaveProperty("error", "Error interno del servidor");
  });

  it("requires professor privileges and validates the collection ID before deletion", async () => {
    mocks.requireProfessor.mockResolvedValueOnce({ session: null, status: 401 });
    expect((await DELETE(new Request("http://localhost/api/collection/4"), routeContext)).status).toBe(
      401,
    );

    mocks.requireProfessor.mockResolvedValueOnce({ session: null, status: 403 });
    expect((await DELETE(new Request("http://localhost/api/collection/4"), routeContext)).status).toBe(
      403,
    );

    expect(
      (
        await DELETE(
          new Request("http://localhost/api/collection/invalid"),
          { params: Promise.resolve({ id: "invalid" }) },
        )
      ).status,
    ).toBe(400);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("returns 404 when the collection entry does not exist", async () => {
    mocks.findUnique.mockResolvedValue(null);

    const response = await DELETE(
      new Request("http://localhost/api/collection/4"),
      routeContext,
    );

    expect(response.status).toBe(404);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("deletes an unused Pokémon in the same transaction as the collection entry", async () => {
    const response = await DELETE(
      new Request("http://localhost/api/collection/4"),
      routeContext,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      message: "Pokemon eliminado de la coleccion",
    });
    expect(mocks.transaction).toHaveBeenCalledOnce();
    expect(mocks.collectionDelete).toHaveBeenCalledWith({ where: { id: 4 } });
    expect(mocks.collectionFindFirst).toHaveBeenCalledWith({
      where: { pokemonId: 25 },
    });
    expect(mocks.pokemonDelete).toHaveBeenCalledWith({ where: { id: 25 } });
  });

  it("keeps a Pokémon that is still referenced by another collection", async () => {
    mocks.collectionFindFirst.mockResolvedValue({ id: 9, userId: 8 });

    const response = await DELETE(
      new Request("http://localhost/api/collection/4"),
      routeContext,
    );

    expect(response.status).toBe(200);
    expect(mocks.pokemonDelete).not.toHaveBeenCalled();
  });

  it("returns an internal error when the deletion transaction fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.transaction.mockRejectedValue(new Error("database unavailable"));

    const response = await DELETE(
      new Request("http://localhost/api/collection/4"),
      routeContext,
    );

    expect(response.status).toBe(500);
  });
});
