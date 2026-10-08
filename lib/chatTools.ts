import { prisma } from "@/lib/prisma";
import { getPokemon, getPokemonByType, getPokemonTypes } from "@/lib/pokeapi";
import { pokemonTypes } from "@/lib/pokemonTypes";

// ==========================================
// TOOL DEFINITIONS
// ==========================================
export const chatTools = [
  {
    type: "function",
    function: {
      name: "get_my_collection",
      description:
        "Obtiene la coleccion actual del usuario (Pokemon capturados) con sus tipos. Usala para recomendar, analizar o comparar contra lo que ya tiene.",
    },
  },
  {
    type: "function",
    function: {
      name: "get_pokemon_info",
      description:
        "Obtiene informacion de un Pokemon desde PokeAPI: tipos, habilidades, altura, peso y sprites.",
      parameters: {
        type: "object",
        properties: {
          pokemon: {
            type: "string",
            description:
              "Nombre en ingles (ej. pikachu) o ID numerico del Pokemon",
          },
        },
        required: ["pokemon"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_pokemon_by_type",
      description:
        "Lista Pokemon de un tipo que el usuario AUN NO tiene en su coleccion. Usala para sugerir que agregar.",
      parameters: {
        type: "object",
        properties: {
          type: {
            type: "string",
            enum: pokemonTypes.map((t) => t.value),
            description: "Tipo de Pokemon en ingles",
          },
          limit: {
            type: "number",
            description: "Cantidad maxima de resultados (default 15, maximo 30)",
          },
        },
        required: ["type"],
      },
    },
  },
];

// ==========================================
// COLLECTION WITH TYPES
// ==========================================
async function getUserCollectionWithTypes(userId: number) {
  const collection = await prisma.collection.findMany({
    where: {
      userId,
      status: "CAUGHT",
    },

    include: {
      pokemon: true,
    },

    orderBy: {
      pokemon: {
        pokeApiId: "asc",
      },
    },
  });

  return Promise.all(
    collection.map(async (item) => ({
      id: item.pokemon.pokeApiId,
      name: item.pokemon.name,
      types: await getPokemonTypes(item.pokemon.pokeApiId),
    }))
  );
}

// ==========================================
// EXECUTE TOOL
// ==========================================
export async function executeChatTool(
  name: string,
  args: Record<string, unknown>,
  userId: number
): Promise<unknown> {
  try {
    // ==========================================
    // GET MY COLLECTION
    // ==========================================
    if (name === "get_my_collection") {
      const pokemon = await getUserCollectionWithTypes(userId);
      const typeCount: Record<string, number> = {};

      for (const item of pokemon) {
        for (const type of item.types) {
          typeCount[type] = (typeCount[type] ?? 0) + 1;
        }
      }

      return {
        total: pokemon.length,
        typeCount,
        pokemon,
      };
    }

    // ==========================================
    // GET POKEMON INFO
    // ==========================================
    if (name === "get_pokemon_info") {
      const data = await getPokemon(String(args.pokemon ?? ""));

      return {
        id: data.id,
        name: data.name,
        height: data.height / 10, // metros
        weight: data.weight / 10, // kg
        types: data.types.map((t) => t.type.name),
        abilities: data.abilities.map((a) => ({
          name: a.ability.name,
          hidden: a.is_hidden,
        })),
        movesCount: data.moves.length,
        sampleMoves: data.moves.slice(0, 10).map((m) => m.move.name),
        sprite: data.sprites.front_default,
      };
    }

    // ==========================================
    // GET POKEMON BY TYPE (NOT OWNED)
    // ==========================================
    if (name === "get_pokemon_by_type") {
      const type = String(args.type ?? "");
      const limit = Math.min(Math.max(Number(args.limit) || 15, 1), 30);

      const [byType, owned] = await Promise.all([
        getPokemonByType(type),
        prisma.collection.findMany({
          where: {
            userId,
            status: "CAUGHT",
          },

          select: {
            pokemon: {
              select: {
                pokeApiId: true,
              },
            },
          },
        }),
      ]);

      const ownedIds = new Set(owned.map((item) => item.pokemon.pokeApiId));

      const available = byType.filter(
        (p) => p.id < 10000 && !ownedIds.has(p.id)
      );

      return {
        type,
        totalAvailable: available.length,
        pokemon: available.slice(0, limit),
      };
    }

    return { error: `Herramienta desconocida: ${name}` };
  } catch (error) {
    console.error(`Error en tool ${name}:`, error);

    return {
      error: error instanceof Error ? error.message : "Error al ejecutar la herramienta",
    };
  }
}