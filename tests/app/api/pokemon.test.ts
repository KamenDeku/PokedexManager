import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getPokemonByTypes: vi.fn(),
  getPokemonList: vi.fn(),
}));

vi.mock("@/lib/pokeapi", () => mocks);

import { GET } from "@/app/api/pokemon/route";

describe("GET /api/pokemon", () => {
  beforeEach(() => {
    mocks.getPokemonByTypes.mockReset();
    mocks.getPokemonList.mockReset();
  });

  it("returns a paginated list for valid limit and offset parameters", async () => {
    const responseBody = {
      count: 1,
      next: null,
      previous: null,
      results: [{ id: 25, name: "pikachu" }],
    };
    mocks.getPokemonList.mockResolvedValue(responseBody);

    const response = await GET(new Request("http://localhost/api/pokemon?limit=20&offset=20"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(responseBody);
    expect(mocks.getPokemonList).toHaveBeenCalledWith(20, 20);
  });

  it.each(["0", "101", "2.5", "-1"])("rejects invalid limit %s", async (limit) => {
    const response = await GET(new Request(`http://localhost/api/pokemon?limit=${limit}`));

    expect(response.status).toBe(400);
    expect(mocks.getPokemonList).not.toHaveBeenCalled();
  });

  it("rejects negative or fractional offsets", async () => {
    for (const offset of ["-1", "1.5"]) {
      const response = await GET(
        new Request(`http://localhost/api/pokemon?offset=${offset}`),
      );
      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toHaveProperty("error", "offset debe ser >= 0");
    }
  });

  it("filters by types, form, and name before paginating", async () => {
    mocks.getPokemonByTypes.mockResolvedValue([
      { id: 6, name: "charizard" },
      { id: 25, name: "pikachu" },
      { id: 10001, name: "charizard-mega-x" },
    ]);

    const response = await GET(
      new Request(
        "http://localhost/api/pokemon?types=fire,flying&forms=mega&name=charizard&limit=1",
      ),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      count: 1,
      results: [{ id: 10001, name: "charizard-mega-x" }],
    });
    expect(mocks.getPokemonByTypes).toHaveBeenCalledWith(["fire", "flying"]);
  });

  it("maps an unknown type to 404 and upstream failures to 500", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.getPokemonByTypes.mockRejectedValueOnce(new Error("Tipo no encontrado"));
    const notFound = await GET(
      new Request("http://localhost/api/pokemon?types=not-a-type"),
    );
    expect(notFound.status).toBe(404);

    mocks.getPokemonByTypes.mockRejectedValueOnce(new Error("network unavailable"));
    const failed = await GET(new Request("http://localhost/api/pokemon?types=fire"));
    expect(failed.status).toBe(500);
    await expect(failed.json()).resolves.toHaveProperty("error", "Error interno del servidor");
  });
});
