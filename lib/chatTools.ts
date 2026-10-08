import { prisma } from "@/lib/prisma";
import { getPokemon, getPokemonByType, getPokemonTypes } from "@/lib/pokeapi";
import { pokemonTypes } from "@/lib/pokemonTypes";
import { saveUserMemory, deleteUserMemory } from "@/lib/memory";

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
  {
    type: "function",
    function: {
      name: "save_memory",
      description:
        "Guarda un dato duradero sobre el usuario para recordarlo en futuras conversaciones. Usa category PREFERENCE para gustos y preferencias (tipo o Pokemon favorito, estilo de respuesta preferido) y FACT para datos o metas (quiere completar Kanto, juega en tal version). Escribe un hecho corto en tercera persona. No guardes datos sensibles, contrasenas ni informacion que ya esta en su coleccion.",
      parameters: {
        type: "object",
        properties: {
          memory: {
            type: "string",
            description:
              "Hecho corto y claro, por ejemplo: 'Su tipo favorito es fuego' o 'Quiere completar la Pokedex de Kanto'",
          },
          category: {
            type: "string",
            enum: ["PREFERENCE", "FACT"],
            description: "PREFERENCE para gustos y preferencias, FACT para datos y metas",
          },
        },
        required: ["memory", "category"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "forget_memory",
      description:
        "Borra un recuerdo del usuario por su id. Usala cuando el usuario pida olvidar algo o cuando un recuerdo ya no sea cierto.",
      parameters: {
        type: "object",
        properties: {
          id: {
            type: "number",
            description: "ID del recuerdo (aparece en la lista de recuerdos del prompt)",
          },
        },
        required: ["id"],
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

    // ==========================================
    // SAVE MEMORY
    // ==========================================
    if (name === "save_memory") {
      const category = args.category === "PREFERENCE" ? "PREFERENCE" : "FACT";

      return await saveUserMemory(userId, String(args.memory ?? ""), category);
    }

    // ==========================================
    // FORGET MEMORY
    // ==========================================
    if (name === "forget_memory") {
      const id = Number(args.id);

      if (!Number.isInteger(id) || id <= 0) {
        return { error: "id invalido" };
      }

      return await deleteUserMemory(userId, id);
    }

    return { error: `Herramienta desconocida: ${name}` };
  } catch (error) {
    console.error(`Error en tool ${name}:`, error);

    return {
      error: error instanceof Error ? error.message : "Error al ejecutar la herramienta",
    };
  }
}