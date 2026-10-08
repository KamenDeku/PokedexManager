import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  collectionFindMany: vi.fn(),
  getPokemon: vi.fn(),
  getPokemonByType: vi.fn(),
  getPokemonTypes: vi.fn(),
  saveUserMemory: vi.fn(),
  deleteUserMemory: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: { collection: { findMany: mocks.collectionFindMany } },
}));
vi.mock("@/lib/pokeapi", () => ({
  getPokemon: mocks.getPokemon,
  getPokemonByType: mocks.getPokemonByType,
  getPokemonTypes: mocks.getPokemonTypes,
}));
vi.mock("@/lib/memory", () => ({
  saveUserMemory: mocks.saveUserMemory,
  deleteUserMemory: mocks.deleteUserMemory,
}));

import { chatTools, executeChatTool } from "@/lib/chatTools";

describe("chat tools", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.collectionFindMany.mockResolvedValue([]);
  });

  it("declares the available tools and restricts Pokémon types to supported values", () => {
    const names = chatTools.map((tool) => tool.function.name);

    expect(names).toEqual([
      "get_my_collection",
      "get_pokemon_info",
      "get_pokemon_by_type",
      "save_memory",
      "forget_memory",
    ]);
    expect(chatTools[2]).toMatchObject({
      function: {
        parameters: {
          properties: {
            type: { enum: expect.arrayContaining(["fire"]) },
          },
        },
      },
    });
  });

  it("returns a caught collection with type counts", async () => {
    mocks.collectionFindMany.mockResolvedValue([
      { pokemon: { pokeApiId: 25, name: "pikachu" } },
      { pokemon: { pokeApiId: 26, name: "raichu" } },
      { pokemon: { pokeApiId: 6, name: "charizard" } },
    ]);
    mocks.getPokemonTypes
      .mockResolvedValueOnce(["electric"])
      .mockResolvedValueOnce(["electric"])
      .mockResolvedValueOnce(["fire", "flying"]);

    await expect(executeChatTool("get_my_collection", {}, 9)).resolves.toEqual({
      total: 3,
      typeCount: { electric: 2, fire: 1, flying: 1 },
      pokemon: [
        { id: 25, name: "pikachu", types: ["electric"] },
        { id: 26, name: "raichu", types: ["electric"] },
        { id: 6, name: "charizard", types: ["fire", "flying"] },
      ],
    });
    expect(mocks.collectionFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 9, status: "CAUGHT" } }),
    );
  });

  it("converts Pokémon detail units and exposes hidden abilities", async () => {
    mocks.getPokemon.mockResolvedValue({
      id: 25,
      name: "pikachu",
      height: 4,
      weight: 60,
      abilities: [
        { ability: { name: "static" }, is_hidden: false },
        { ability: { name: "lightning-rod" }, is_hidden: true },
      ],
      moves: Array.from({ length: 12 }, (_, index) => ({
        move: { name: `move-${index}` },
      })),
      sprites: { front_default: "pikachu.png" },
      types: [{ type: { name: "electric" } }],
    });

    await expect(
      executeChatTool("get_pokemon_info", { pokemon: "25" }, 9),
    ).resolves.toEqual({
      id: 25,
      name: "pikachu",
      height: 0.4,
      weight: 6,
      types: ["electric"],
      abilities: [
        { name: "static", hidden: false },
        { name: "lightning-rod", hidden: true },
      ],
      movesCount: 12,
      sampleMoves: Array.from({ length: 10 }, (_, index) => `move-${index}`),
      sprite: "pikachu.png",
    });
    expect(mocks.getPokemon).toHaveBeenCalledWith("25");
  });

  it("filters owned and non-base-form candidates and clamps recommendation limits", async () => {
    mocks.getPokemonByType.mockResolvedValue(
      Array.from({ length: 35 }, (_, index) => ({
        id: index + 1,
        name: `pokemon-${index + 1}`,
      })).concat([{ id: 10001, name: "special-form" }]),
    );
    mocks.collectionFindMany.mockResolvedValue([
      { pokemon: { pokeApiId: 1 } },
      { pokemon: { pokeApiId: 2 } },
    ]);

    const result = await executeChatTool("get_pokemon_by_type", { type: "fire", limit: 100 }, 9);

    expect(result).toEqual({
      type: "fire",
      totalAvailable: 33,
      pokemon: Array.from({ length: 30 }, (_, index) => ({
        id: index + 3,
        name: `pokemon-${index + 3}`,
      })),
    });
    expect(mocks.collectionFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 9, status: "CAUGHT" } }),
    );
  });

  it("uses the default recommendation limit and enforces a minimum of one", async () => {
    mocks.getPokemonByType.mockResolvedValue([{ id: 25, name: "pikachu" }]);
    mocks.collectionFindMany.mockResolvedValue([]);

    await expect(executeChatTool("get_pokemon_by_type", { type: "electric" }, 9)).resolves.toMatchObject({
      totalAvailable: 1,
      pokemon: [{ id: 25, name: "pikachu" }],
    });
    await expect(
      executeChatTool("get_pokemon_by_type", { type: "electric", limit: -5 }, 9),
    ).resolves.toMatchObject({ pokemon: [{ id: 25, name: "pikachu" }] });
  });

  it("saves and deletes memories using the current user ID", async () => {
    mocks.saveUserMemory.mockResolvedValue({ saved: true });
    mocks.deleteUserMemory.mockResolvedValue({ deleted: true });

    await expect(
      executeChatTool(
        "save_memory",
        { memory: "Prefiere agua", category: "PREFERENCE" },
        9,
      ),
    ).resolves.toEqual({ saved: true });
    expect(mocks.saveUserMemory).toHaveBeenCalledWith(9, "Prefiere agua", "PREFERENCE");

    await expect(executeChatTool("forget_memory", { id: 2 }, 9)).resolves.toEqual({
      deleted: true,
    });
    expect(mocks.deleteUserMemory).toHaveBeenCalledWith(9, 2);
  });

  it("rejects invalid memory IDs and unknown tools without side effects", async () => {
    await expect(executeChatTool("forget_memory", { id: 0 }, 9)).resolves.toEqual({
      error: "id invalido",
    });
    await expect(executeChatTool("unknown", {}, 9)).resolves.toEqual({
      error: "Herramienta desconocida: unknown",
    });
    expect(mocks.deleteUserMemory).not.toHaveBeenCalled();
  });

  it("converts downstream service errors into tool error results", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.getPokemon.mockRejectedValue(new Error("Pokemon no encontrado"));

    await expect(
      executeChatTool("get_pokemon_info", { pokemon: "missingno" }, 9),
    ).resolves.toEqual({ error: "Pokemon no encontrado" });
  });
});
