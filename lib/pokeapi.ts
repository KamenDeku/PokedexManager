const POKE_API_URL = "https://pokeapi.co/api/v2";

// ------------------------------------------
// INFO
// ------------------------------------------
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

// ------------------------------------------
// RESPONSE
// ------------------------------------------
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

// ------------------------------------------
export async function getPokemon(pokemon: string): Promise<PokemonDetails> {
  const pokemonName = pokemon.trim().toLowerCase();

  if (!pokemonName) {
    throw new Error("El nombre del Pokémon es requerido");
  }

  const response = await fetch(`${POKE_API_URL}/pokemon/${pokemonName}`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Pokémon no encontrado");
    }

    throw new Error("Error al consultar PokéAPI");
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
      front_default: data.sprites.front_default,
      front_shiny: data.sprites.front_shiny,
      back_default: data.sprites.back_default,
      back_shiny: data.sprites.back_shiny,
    },
    types: data.types,
  };
}