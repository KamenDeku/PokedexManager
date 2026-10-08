import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  collectionUpsert: vi.fn(),
  collectionFindMany: vi.fn(),
  pokemonUpsert: vi.fn(),
  userFindUnique: vi.fn(),
  requireAuth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    collection: {
      upsert: mocks.collectionUpsert,
      findMany: mocks.collectionFindMany,
    },
    pokemon: { upsert: mocks.pokemonUpsert },
    user: { findUnique: mocks.userFindUnique },
  },
}));
vi.mock("@/lib/authorization", () => ({ requireAuth: mocks.requireAuth }));

import { GET, POST } from "@/app/api/collection/route";

const trainerSession = {
  user: { id: "7", name: "Misty", role: "TRAINER" },
};

describe("/api/collection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAuth.mockResolvedValue({ session: trainerSession, status: 200 });
  });

  it("rejects collection writes without authentication", async () => {
    mocks.requireAuth.mockResolvedValue({ session: null, status: 401 });

    const response = await POST(
      new Request("http://localhost/api/collection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pokeApiId: 25, name: "pikachu" }),
      }),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toHaveProperty("error", "No autenticado");
    expect(mocks.pokemonUpsert).not.toHaveBeenCalled();
  });

  it("validates required fields before database access", async () => {
    const response = await POST(
      new Request("http://localhost/api/collection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pokeApiId: 25 }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toHaveProperty(
      "error",
      "pokeApiId y name es requerido",
    );
    expect(mocks.userFindUnique).not.toHaveBeenCalled();
  });

  it("upserts Pokémon and collection to make adding the same Pokémon repeatable", async () => {
    const pokemon = { id: 88, pokeApiId: 25, name: "pikachu" };
    const collection = { id: 3, userId: 7, pokemonId: 88, status: "CAUGHT", pokemon };
    mocks.userFindUnique.mockResolvedValue({ id: 7 });
    mocks.pokemonUpsert.mockResolvedValue(pokemon);
    mocks.collectionUpsert.mockResolvedValue(collection);

    const response = await POST(
      new Request("http://localhost/api/collection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pokeApiId: 25, name: "pikachu" }),
      }),
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual(collection);
    expect(mocks.pokemonUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { pokeApiId: 25 },
        update: {},
        create: { pokeApiId: 25, name: "pikachu" },
      }),
    );
    expect(mocks.collectionUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId_pokemonId: { userId: 7, pokemonId: 88 } },
        update: { status: "CAUGHT" },
        create: { userId: 7, pokemonId: 88, status: "CAUGHT" },
      }),
    );
  });

  it("returns an internal error when the database rejects a write", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.userFindUnique.mockRejectedValue(new Error("database unavailable"));

    const response = await POST(
      new Request("http://localhost/api/collection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pokeApiId: 25, name: "pikachu" }),
      }),
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toHaveProperty("error", "Error interno del servidor");
  });

  it("returns the current user's caught collection", async () => {
    mocks.userFindUnique.mockResolvedValue({ id: 7 });
    mocks.collectionFindMany.mockResolvedValue([
      { id: 3, status: "CAUGHT", pokemon: { pokeApiId: 25, name: "pikachu" } },
    ]);

    const response = await GET(new Request("http://localhost/api/collection"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual([
      { id: 3, status: "CAUGHT", pokemon: { pokeApiId: 25, name: "pikachu" } },
    ]);
    expect(mocks.collectionFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 7, status: "CAUGHT" },
      }),
    );
  });

  it("prevents trainers from reading another user's collection", async () => {
    const response = await GET(
      new Request("http://localhost/api/collection?userId=8"),
    );

    expect(response.status).toBe(403);
    expect(mocks.userFindUnique).not.toHaveBeenCalled();
  });

  it("allows professors to read another user's collection", async () => {
    mocks.requireAuth.mockResolvedValue({
      session: { user: { ...trainerSession.user, role: "PROFESSOR" } },
      status: 200,
    });
    mocks.userFindUnique.mockResolvedValue({ id: 8 });
    mocks.collectionFindMany.mockResolvedValue([]);

    const response = await GET(
      new Request("http://localhost/api/collection?userId=8"),
    );

    expect(response.status).toBe(200);
    expect(mocks.collectionFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 8, status: "CAUGHT" } }),
    );
  });
});
