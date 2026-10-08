import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getPokemon,
  getPokemonByType,
  getPokemonByTypes,
  getPokemonList,
  getPokemonTypes,
} from "@/lib/pokeapi";

const pokemonDetails = {
  id: 25,
  name: "pikachu",
  height: 4,
  weight: 60,
  abilities: [],
  forms: [{ name: "pikachu", url: "https://pokeapi.co/api/v2/pokemon-form/25/" }],
  moves: [],
  species: { name: "pikachu", url: "https://pokeapi.co/api/v2/pokemon-species/25/" },
  sprites: {
    front_default: "https://example.test/pikachu.png",
    front_shiny: null,
    back_default: null,
    back_shiny: null,
  },
  types: [{ slot: 1, type: { name: "electric", url: "https://example.test/type/13" } }],
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("PokéAPI service", () => {
  it("maps list results to names and numeric IDs", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({
        count: 1302,
        next: "https://pokeapi.co/api/v2/pokemon?offset=1",
        previous: null,
        results: [{ name: "bulbasaur", url: "https://pokeapi.co/api/v2/pokemon/1/" }],
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(getPokemonList(1, 0)).resolves.toEqual({
      count: 1302,
      next: "https://pokeapi.co/api/v2/pokemon?offset=1",
      previous: null,
      results: [{ id: 1, name: "bulbasaur" }],
    });
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/pokemon?limit=1&offset=0"),
      { cache: "no-store" },
    );
  });

  it("rejects list requests when PokéAPI returns an error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 503 })));

    await expect(getPokemonList(20, 0)).rejects.toThrow(
      "Error al consultar la lista de Pokemones",
    );
  });

  it("normalizes Pokémon names and returns the supported detail fields", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json(pokemonDetails));
    vi.stubGlobal("fetch", fetchMock);

    await expect(getPokemon(" Pikachu ")).resolves.toEqual(pokemonDetails);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/pokemon/pikachu"),
      { cache: "no-store" },
    );
  });

  it("rejects an empty Pokémon name before making a request", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(getPokemon("  ")).rejects.toThrow("El nombre del Pokemon es requerido");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("distinguishes missing Pokémon from upstream server errors", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 404 })));
    await expect(getPokemon("missingno")).rejects.toThrow("Pokemon no encontrado");

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 500 })));
    await expect(getPokemon("pikachu")).rejects.toThrow("Error al consultar PokeAPI");
  });

  it("maps Pokémon returned by type and reports invalid or missing types", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({
        pokemon: [
          { pokemon: { name: "pikachu", url: "https://pokeapi.co/api/v2/pokemon/25/" } },
          { pokemon: { name: "raichu", url: "https://pokeapi.co/api/v2/pokemon/26/" } },
        ],
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(getPokemonByType(" Electric ")).resolves.toEqual([
      { id: 25, name: "pikachu" },
      { id: 26, name: "raichu" },
    ]);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/type/electric"),
      { cache: "no-store" },
    );

    await expect(getPokemonByType(" ")).rejects.toThrow("El tipo de Pokemon es requerido");

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 404 })));
    await expect(getPokemonByType("unknown")).rejects.toThrow("Tipo no encontrado");
  });

  it("returns the intersection when filtering by multiple types", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({
          pokemon: [
            { pokemon: { name: "pikachu", url: "https://pokeapi.co/api/v2/pokemon/25/" } },
            { pokemon: { name: "raichu", url: "https://pokeapi.co/api/v2/pokemon/26/" } },
          ],
        }),
      )
      .mockResolvedValueOnce(
        Response.json({
          pokemon: [
            { pokemon: { name: "pikachu", url: "https://pokeapi.co/api/v2/pokemon/25/" } },
            { pokemon: { name: "voltorb", url: "https://pokeapi.co/api/v2/pokemon/100/" } },
          ],
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    await expect(getPokemonByTypes(["electric", "steel"])).resolves.toEqual([
      { id: 25, name: "pikachu" },
    ]);
    await expect(getPokemonByTypes([])).rejects.toThrow("El tipo de Pokemon es requerido");
  });

  it("sorts and caches Pokémon types by slot", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({
        types: [
          { slot: 2, type: { name: "flying" } },
          { slot: 1, type: { name: "electric" } },
        ],
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(getPokemonTypes(900001)).resolves.toEqual(["electric", "flying"]);
    await expect(getPokemonTypes(900001)).resolves.toEqual(["electric", "flying"]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("surfaces upstream failures while loading Pokémon types", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 502 })));

    await expect(getPokemonTypes(900002)).rejects.toThrow("Error al consultar PokeAPI");
  });
});
