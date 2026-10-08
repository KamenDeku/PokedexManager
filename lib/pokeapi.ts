const POKE_API_URL = process.env.POKE_API_URL || "https://pokeapi.co/api/v2";

export interface PokemonListItem {
  id: number;
  name: string;
}

export interface PokemonListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: PokemonListItem[];
}

interface PokemonAbility {
  ability: {
    name: string;
    url: string;
  };
  is_hidden: boolean;
}

interface PokemonForm {
  name: string;
  url: string;
}

interface PokemonMove {
  move: {
    name: string;
    url: string;
  };
}

interface PokemonSpecies {
  name: string;
  url: string;
}

interface PokemonSprites {
  front_default: string | null;
  front_shiny: string | null;
  back_default: string | null;
  back_shiny: string | null;
}

interface PokemonType {
  slot: number;
  type: {
    name: string;
    url: string;
  };
}

export interface PokemonDetails {
  id: number;
  name: string;
  height: number;
  weight: number;

  abilities: PokemonAbility[];
  forms: PokemonForm[];
  moves: PokemonMove[];
  species: PokemonSpecies;
  sprites: PokemonSprites;
  types: PokemonType[];
}

export interface PokemonTypeListItem {
  id: number;
  name: string;
}

export async function getPokemonList(limit: number, offset: number): Promise<PokemonListResponse> {

  const response = await fetch(`${POKE_API_URL}/pokemon?limit=${limit}&offset=${offset}`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(
      "Error al consultar la lista de Pokemones"
    );
  }

  const data = await response.json();

  const results: PokemonListItem[] = data.results.map(
      (pokemon: {
        name: string;
        url: string;
      }) => {

        const id = Number(pokemon.url.split("/").filter(Boolean).pop());

        return {
          id,
          name: pokemon.name,
        };
      }
    );

  return {
    count: data.count,
    next: data.next,
    previous: data.previous,
    results,
  };
}

export async function getPokemon(pokemon: string): Promise<PokemonDetails> {

  const pokemonName = pokemon.trim().toLowerCase();

  if (!pokemonName) {
    throw new Error(
      "El nombre del Pokemon es requerido"
    );
  }

  const response = await fetch(`${POKE_API_URL}/pokemon/${pokemonName}`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {

    if (response.status === 404) {
      throw new Error(
        "Pokemon no encontrado"
      );
    }

    throw new Error(
      "Error al consultar PokeAPI"
    );
  }

  const data = await response.json();

  return {
    id: data.id,
    name: data.name,
    height: data.height,
    weight: data.weight,

    abilities: data.abilities,
    forms: data.forms,
    moves: data.moves,
    species: data.species,

    sprites: {
      front_default:
        data.sprites.front_default,

      front_shiny:
        data.sprites.front_shiny,

      back_default:
        data.sprites.back_default,

      back_shiny:
        data.sprites.back_shiny,
    },

    types: data.types,
  };
}

export async function getPokemonByType(
  type: string
): Promise<PokemonListItem[]> {
  const pokemonType = type.trim().toLowerCase();

  if (!pokemonType) {
    throw new Error("El tipo de Pokemon es requerido");
  }

  const response = await fetch(
    `${POKE_API_URL}/type/${pokemonType}`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Tipo no encontrado");
    }

    throw new Error("Error al consultar PokeAPI");
  }

  const data = await response.json();

  return data.pokemon.map(
    (item: {
      pokemon: {
        name: string;
        url: string;
      };
    }) => {
      const id = Number(
        item.pokemon.url
          .split("/")
          .filter(Boolean)
          .pop()
      );

      return {
        id,
        name: item.pokemon.name,
      };
    }
  );
}

export async function getPokemonByTypes(
  types: string[]
): Promise<PokemonListItem[]> {
  if (types.length === 0) {
    throw new Error("El tipo de Pokemon es requerido");
  }

  const lists = await Promise.all(
    types.map((type) => getPokemonByType(type))
  );

  const [first, ...rest] = lists;

  const restIds = rest.map(
    (list) => new Set(list.map((item) => item.id))
  );

  return first.filter((item) =>
    restIds.every((ids) => ids.has(item.id))
  );
}

const typesCache = new Map<number, string[]>();

export async function getPokemonTypes(id: number): Promise<string[]> {
  const cached = typesCache.get(id);

  if (cached) {
    return cached;
  }

  const response = await fetch(`${POKE_API_URL}/pokemon/${id}`);

  if (!response.ok) {
    throw new Error("Error al consultar PokeAPI");
  }

  const data = await response.json();

  const types: string[] = data.types
    .sort((a: PokemonType, b: PokemonType) => a.slot - b.slot)
    .map((item: PokemonType) => item.type.name);

  typesCache.set(id, types);

  return types;
}
