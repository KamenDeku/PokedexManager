import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { hashPassword } from "../lib/password";

const adapter = new PrismaMariaDb({
  host: process.env.DB_HOST!,
  port: Number(process.env.DB_PORT!),
  user: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,
  database: process.env.DB_NAME!,
});

const prisma = new PrismaClient({
  adapter,
});

// ==========================================
// DATA
// ==========================================
const users = [
  {
    id: 1,
    name: "Professor Oak",
    password: "oak123",
    role: "PROFESSOR" as const,
  },
  {
    id: 2,
    name: "Ash Ketchum",
    password: "ash123",
    role: "TRAINER" as const,
  },
  {
    id: 3,
    name: "Misty",
    password: "misty123",
    role: "TRAINER" as const,
  },
  {
    id: 4,
    name: "Brock",
    password: "brock123",
    role: "TRAINER" as const,
  },
  {
    id: 5,
    name: "Gary Oak",
    password: "gary123",
    role: "TRAINER" as const,
  },
  {
    id: 6,
    name: "May",
    password: "may123",
    role: "TRAINER" as const,
  },
  {
    id: 7,
    name: "Dawn",
    password: "dawn123",
    role: "TRAINER" as const,
  },
  {
    id: 8,
    name: "Serena",
    password: "serena123",
    role: "TRAINER" as const,
  },
  {
    id: 9,
    name: "Clemont",
    password: "clemont123",
    role: "TRAINER" as const,
  },
  {
    id: 10,
    name: "Lillie",
    password: "lillie123",
    role: "TRAINER" as const,
  },
];

const pokemons = [
  {
    pokeApiId: 25,
    name: "Pikachu",
  },
  {
    pokeApiId: 4,
    name: "Charmander",
  },
  {
    pokeApiId: 7,
    name: "Squirtle",
  },
  {
    pokeApiId: 1,
    name: "Bulbasaur",
  },
  {
    pokeApiId: 150,
    name: "Mewtwo",
  },
  {
    pokeApiId: 6,
    name: "Charizard",
  },
  {
    pokeApiId: 9,
    name: "Blastoise",
  },
  {
    pokeApiId: 3,
    name: "Venusaur",
  },
  {
    pokeApiId: 2,
    name: "Ivysaur",
  },
  {
    pokeApiId: 5,
    name: "Charmeleon",
  },
  {
    pokeApiId: 8,
    name: "Wartortle",
  },
  {
    pokeApiId: 10,
    name: "Caterpie",
  },
  {
    pokeApiId: 12,
    name: "Butterfree",
  },
  {
    pokeApiId: 19,
    name: "Rattata",
  },
  {
    pokeApiId: 20,
    name: "Raticate",
  },
  {
    pokeApiId: 21,
    name: "Spearow",
  },
  {
    pokeApiId: 22,
    name: "Fearow",
  },
  {
    pokeApiId: 39,
    name: "Jigglypuff",
  },
  {
    pokeApiId: 54,
    name: "Psyduck",
  },
  {
    pokeApiId: 59,
    name: "Arcanine",
  },
  {
    pokeApiId: 94,
    name: "Gengar",
  },
  {
    pokeApiId: 131,
    name: "Lapras",
  },
  {
    pokeApiId: 143,
    name: "Snorlax",
  },
  {
    pokeApiId: 149,
    name: "Dragonite",
  },
  {
    pokeApiId: 151,
    name: "Mew",
  },
  {
    pokeApiId: 155,
    name: "Cyndaquil",
  },
  {
    pokeApiId: 158,
    name: "Totodile",
  },
  {
    pokeApiId: 175,
    name: "Togepi",
  },
  {
    pokeApiId: 197,
    name: "Umbreon",
  },
  {
    pokeApiId: 249,
    name: "Lugia",
  },
];

// ==========================================
// CHAT MESSAGES
// ==========================================

const chatMessages = [
  // ==========================================
  // PROFESSOR OAK
  // ==========================================
  {
    userId: 1,
    role: "USER" as const,
    content: "Hola Rotom, mi Pokemon favorito es Bulbasaur.",
  },
  {
    userId: 1,
    role: "ASSISTANT" as const,
    content:
      "¡Entendido! Recordare que Bulbasaur es tu Pokemon favorito. Es una excelente eleccion, especialmente si te gustan los Pokemon de tipo Planta y Veneno.",
  },
  {
    userId: 1,
    role: "USER" as const,
    content: "¿Que Pokemon de tipo Planta me recomiendas para mi coleccion?",
  },
  {
    userId: 1,
    role: "ASSISTANT" as const,
    content:
      "Como ya tienes a Bulbasaur, te recomiendo buscar Pokemon de tipo Planta que complementen tu coleccion. Podemos revisar cuales tienes actualmente y buscar opciones diferentes.",
  },
  {
    userId: 1,
    role: "USER" as const,
    content: "Prefiero respuestas cortas cuando te pregunte por Pokemon.",
  },
  {
    userId: 1,
    role: "ASSISTANT" as const,
    content:
      "Perfecto. Intentare mantener mis respuestas cortas cuando hablemos de Pokemon.",
  },

  // ==========================================
  // ASH KETCHUM
  // ==========================================
  {
    userId: 2,
    role: "USER" as const,
    content: "Rotom, me gustan mucho los Pokemon de tipo Fuego.",
  },
  {
    userId: 2,
    role: "ASSISTANT" as const,
    content:
      "¡Genial! Tomare en cuenta que te gustan los Pokemon de tipo Fuego cuando te haga recomendaciones.",
  },
  {
    userId: 2,
    role: "USER" as const,
    content: "¿Que Pokemon me falta para completar mejor mi coleccion?",
  },
  {
    userId: 2,
    role: "ASSISTANT" as const,
    content:
      "Revisare tu coleccion y buscare Pokemon que complementen los tipos que tienes menos representados.",
  },
  {
    userId: 2,
    role: "USER" as const,
    content: "Tambien me gusta mucho Charizard.",
  },
  {
    userId: 2,
    role: "ASSISTANT" as const,
    content:
      "Lo tendre en cuenta. Charizard es uno de tus Pokemon favoritos.",
  },

  // ==========================================
  // MISTY
  // ==========================================
  {
    userId: 3,
    role: "USER" as const,
    content: "Me gustan los Pokemon de tipo Agua.",
  },
  {
    userId: 3,
    role: "ASSISTANT" as const,
    content:
      "¡Perfecto! Lo recordare para futuras recomendaciones de Pokemon.",
  },
  {
    userId: 3,
    role: "USER" as const,
    content: "Psyduck es uno de mis favoritos.",
  },
  {
    userId: 3,
    role: "ASSISTANT" as const,
    content:
      "¡Buena eleccion! Recordare que Psyduck es uno de tus Pokemon favoritos.",
  },
  {
    userId: 3,
    role: "USER" as const,
    content: "¿Tengo buenos Pokemon de Agua en mi coleccion?",
  },
  {
    userId: 3,
    role: "ASSISTANT" as const,
    content:
      "Si. Tienes varios Pokemon de Agua en tu coleccion, incluyendo Squirtle y Psyduck.",
  },

  // ==========================================
  // BROCK
  // ==========================================
  {
    userId: 4,
    role: "USER" as const,
    content: "Me gustan los Pokemon fuertes y resistentes.",
  },
  {
    userId: 4,
    role: "ASSISTANT" as const,
    content:
      "Entendido. Tomare en cuenta que prefieres Pokemon resistentes al hacer recomendaciones.",
  },
  {
    userId: 4,
    role: "USER" as const,
    content: "¿Que Pokemon de mi coleccion son los mas resistentes?",
  },
  {
    userId: 4,
    role: "ASSISTANT" as const,
    content:
      "Snorlax es una de las opciones que destaca por su gran resistencia. Tambien puedo revisar otros Pokemon de tu coleccion.",
  },

  // ==========================================
  // GARY OAK
  // ==========================================
  {
    userId: 5,
    role: "USER" as const,
    content: "Prefiero que me recomiendes Pokemon que no tenga.",
  },
  {
    userId: 5,
    role: "ASSISTANT" as const,
    content:
      "De acuerdo. Cuando te haga recomendaciones revisare primero tu coleccion para evitar Pokemon que ya tengas.",
  },
  {
    userId: 5,
    role: "USER" as const,
    content: "Mew y Mewtwo son mis favoritos.",
  },
  {
    userId: 5,
    role: "ASSISTANT" as const,
    content:
      "Lo recordare. Mew y Mewtwo son tus Pokemon favoritos.",
  },

  // ==========================================
  // MAY
  // ==========================================
  {
    userId: 6,
    role: "USER" as const,
    content: "Me gustan los Pokemon de Johto.",
  },
  {
    userId: 6,
    role: "ASSISTANT" as const,
    content:
      "¡Perfecto! Tomare en cuenta tu preferencia por Pokemon de Johto.",
  },
  {
    userId: 6,
    role: "USER" as const,
    content: "Cyndaquil es mi favorito.",
  },
  {
    userId: 6,
    role: "ASSISTANT" as const,
    content:
      "Entendido. Recordare que Cyndaquil es tu Pokemon favorito.",
  },

  // ==========================================
  // DAWN
  // ==========================================
  {
    userId: 7,
    role: "USER" as const,
    content: "Me gustan los Pokemon lindos.",
  },
  {
    userId: 7,
    role: "ASSISTANT" as const,
    content:
      "¡Entendido! Puedo tener en cuenta esa preferencia cuando te recomiende Pokemon.",
  },
  {
    userId: 7,
    role: "USER" as const,
    content: "Togepi me encanta.",
  },
  {
    userId: 7,
    role: "ASSISTANT" as const,
    content:
      "Lo recordare. Togepi es uno de tus Pokemon favoritos.",
  },

  // ==========================================
  // SERENA
  // ==========================================
  {
    userId: 8,
    role: "USER" as const,
    content: "Me gustan mucho Umbreon y Eevee.",
  },
  {
    userId: 8,
    role: "ASSISTANT" as const,
    content:
      "¡Buena eleccion! Recordare que te gustan especialmente Umbreon y Eevee.",
  },
  {
    userId: 8,
    role: "USER" as const,
    content: "Quiero completar una coleccion de Pokemon de tipo Oscuro.",
  },
  {
    userId: 8,
    role: "ASSISTANT" as const,
    content:
      "Perfecto. Puedo ayudarte a buscar Pokemon de tipo Oscuro que aun no tengas.",
  },

  // ==========================================
  // CLEMONT
  // ==========================================
  {
    userId: 9,
    role: "USER" as const,
    content: "Me interesan los Pokemon de tipo Electrico.",
  },
  {
    userId: 9,
    role: "ASSISTANT" as const,
    content:
      "Lo tendre en cuenta para futuras recomendaciones.",
  },
  {
    userId: 9,
    role: "USER" as const,
    content: "Pikachu es mi favorito.",
  },
  {
    userId: 9,
    role: "ASSISTANT" as const,
    content:
      "Entendido. Recordare que Pikachu es tu Pokemon favorito.",
  },

  // ==========================================
  // LILLIE
  // ==========================================
  {
    userId: 10,
    role: "USER" as const,
    content: "Me gustan los Pokemon legendarios.",
  },
  {
    userId: 10,
    role: "ASSISTANT" as const,
    content:
      "Perfecto. Tendre en cuenta tu interes por los Pokemon legendarios.",
  },
  {
    userId: 10,
    role: "USER" as const,
    content: "Mew es uno de mis Pokemon favoritos.",
  },
  {
    userId: 10,
    role: "ASSISTANT" as const,
    content:
      "Lo recordare. Mew es uno de tus Pokemon favoritos.",
  },
];

// ==========================================
// USER MEMORIES
// ==========================================

const userMemories = [
  // PROFESSOR OAK
  {
    userId: 1,
    category: "PREFERENCE" as const,
    content: "Su Pokemon favorito es Bulbasaur.",
  },
  {
    userId: 1,
    category: "PREFERENCE" as const,
    content: "Prefiere respuestas cortas.",
  },

  // ASH KETCHUM
  {
    userId: 2,
    category: "PREFERENCE" as const,
    content: "Le gustan los Pokemon de tipo Fuego.",
  },
  {
    userId: 2,
    category: "PREFERENCE" as const,
    content: "Charizard es uno de sus Pokemon favoritos.",
  },

  // MISTY
  {
    userId: 3,
    category: "PREFERENCE" as const,
    content: "Le gustan los Pokemon de tipo Agua.",
  },
  {
    userId: 3,
    category: "PREFERENCE" as const,
    content: "Psyduck es uno de sus Pokemon favoritos.",
  },

  // BROCK
  {
    userId: 4,
    category: "PREFERENCE" as const,
    content: "Prefiere Pokemon fuertes y resistentes.",
  },

  // GARY OAK
  {
    userId: 5,
    category: "PREFERENCE" as const,
    content: "Prefiere recibir recomendaciones de Pokemon que no tenga.",
  },
  {
    userId: 5,
    category: "PREFERENCE" as const,
    content: "Mew y Mewtwo son sus Pokemon favoritos.",
  },

  // MAY
  {
    userId: 6,
    category: "PREFERENCE" as const,
    content: "Le gustan los Pokemon de Johto.",
  },
  {
    userId: 6,
    category: "PREFERENCE" as const,
    content: "Cyndaquil es su Pokemon favorito.",
  },

  // DAWN
  {
    userId: 7,
    category: "PREFERENCE" as const,
    content: "Le gustan los Pokemon lindos.",
  },
  {
    userId: 7,
    category: "PREFERENCE" as const,
    content: "Togepi es uno de sus Pokemon favoritos.",
  },

  // SERENA
  {
    userId: 8,
    category: "PREFERENCE" as const,
    content: "Le gustan Umbreon y Eevee.",
  },
  {
    userId: 8,
    category: "PREFERENCE" as const,
    content: "Quiere completar una coleccion de Pokemon de tipo Oscuro.",
  },

  // CLEMONT
  {
    userId: 9,
    category: "PREFERENCE" as const,
    content: "Le interesan los Pokemon de tipo Electrico.",
  },
  {
    userId: 9,
    category: "PREFERENCE" as const,
    content: "Pikachu es su Pokemon favorito.",
  },

  // LILLIE
  {
    userId: 10,
    category: "PREFERENCE" as const,
    content: "Le gustan los Pokemon legendarios.",
  },
  {
    userId: 10,
    category: "PREFERENCE" as const,
    content: "Mew es uno de sus Pokemon favoritos.",
  },
];

async function main() {
  console.log("Iniciando seed...");

  // ==========================================
  // USERS - Functiion
  // ==========================================
  const createdUsers = new Map<number, { id: number }>();

  for (const user of users) {
    const existingUser = await prisma.user.findUnique({
        where: {
          id: user.id,
        },
      });

    const hashedPassword = existingUser?.password ?? await hashPassword(user.password);

    const savedUser = await prisma.user.upsert({
        where: {
          id: user.id,
        },
        update: {
          name: user.name,
          role: user.role,
        },
        create: {
          id: user.id,
          name: user.name,
          password: hashedPassword,
          role: user.role,
        },
      });

    createdUsers.set(
      user.id,
      {
        id: savedUser.id,
      }
    );
  }

  // ==========================================
  // CHAT MESSAGES
  // ==========================================
  for (const message of chatMessages) {
    const existingMessages = await prisma.chatMessage.count({
      where: {
        userId: message.userId,
      },
    });

    if (existingMessages === 0) {
      await prisma.chatMessage.create({
        data: {
          userId: message.userId,
          role: message.role,
          content: message.content,
        },
      });
    }
  }

  // ==========================================
  // USER MEMORIES
  // ==========================================
  for (const memory of userMemories) {
    const existingMemory = await prisma.userMemory.findFirst({
      where: {
        userId: memory.userId,
        content: memory.content,
      },
    });

    if (!existingMemory) {
      await prisma.userMemory.create({
        data: {
          userId: memory.userId,
          category: memory.category,
          content: memory.content,
        },
      });
    }
  }

  // ==========================================
  // POKEMON - Functiion
  // ==========================================
  const createdPokemons = new Map<number, { id: number }>();

  for (const pokemon of pokemons) {
    const savedPokemon = await prisma.pokemon.upsert({
        where: {
          pokeApiId: pokemon.pokeApiId,
        },
        update: {
          name: pokemon.name,
        },
        create: {
          pokeApiId: pokemon.pokeApiId,
          name: pokemon.name,
        },
      });

    createdPokemons.set(
      pokemon.pokeApiId,
      {
        id: savedPokemon.id,
      }
    );
  }

  // ==========================================
  // COLLECTION
  // ==========================================
  const collections = [
    // ==========================================
    // PROFESSOR OAK
    // ==========================================
    {
      userId: 1,
      pokemonPokeApiId: 25,
      status: "CAUGHT" as const,
    },
    {
      userId: 1,
      pokemonPokeApiId: 4,
      status: "CAUGHT" as const,
    },
    {
      userId: 1,
      pokemonPokeApiId: 7,
      status: "NOT_CAUGHT" as const,
    },
    {
      userId: 1,
      pokemonPokeApiId: 1,
      status: "CAUGHT" as const,
    },
  
    // ==========================================
    // ASH KETCHUM
    // ==========================================
    {
      userId: 2,
      pokemonPokeApiId: 25,
      status: "CAUGHT" as const,
    },
    {
      userId: 2,
      pokemonPokeApiId: 6,
      status: "CAUGHT" as const,
    },
    {
      userId: 2,
      pokemonPokeApiId: 9,
      status: "CAUGHT" as const,
    },
    {
      userId: 2,
      pokemonPokeApiId: 150,
      status: "NOT_CAUGHT" as const,
    },
  
    // ==========================================
    // MISTY
    // ==========================================
    {
      userId: 3,
      pokemonPokeApiId: 7,
      status: "CAUGHT" as const,
    },
    {
      userId: 3,
      pokemonPokeApiId: 54,
      status: "CAUGHT" as const,
    },
    {
      userId: 3,
      pokemonPokeApiId: 131,
      status: "CAUGHT" as const,
    },
    {
      userId: 3,
      pokemonPokeApiId: 25,
      status: "NOT_CAUGHT" as const,
    },
  
    // ==========================================
    // BROCK
    // ==========================================
    {
      userId: 4,
      pokemonPokeApiId: 1,
      status: "CAUGHT" as const,
    },
    {
      userId: 4,
      pokemonPokeApiId: 143,
      status: "CAUGHT" as const,
    },
    {
      userId: 4,
      pokemonPokeApiId: 149,
      status: "NOT_CAUGHT" as const,
    },
    {
      userId: 4,
      pokemonPokeApiId: 94,
      status: "CAUGHT" as const,
    },
  
    // ==========================================
    // GARY OAK
    // ==========================================
    {
      userId: 5,
      pokemonPokeApiId: 150,
      status: "CAUGHT" as const,
    },
    {
      userId: 5,
      pokemonPokeApiId: 151,
      status: "CAUGHT" as const,
    },
    {
      userId: 5,
      pokemonPokeApiId: 149,
      status: "CAUGHT" as const,
    },
    {
      userId: 5,
      pokemonPokeApiId: 25,
      status: "NOT_CAUGHT" as const,
    },
  
    // ==========================================
    // MAY
    // ==========================================
    {
      userId: 6,
      pokemonPokeApiId: 155,
      status: "CAUGHT" as const,
    },
    {
      userId: 6,
      pokemonPokeApiId: 158,
      status: "CAUGHT" as const,
    },
    {
      userId: 6,
      pokemonPokeApiId: 175,
      status: "CAUGHT" as const,
    },
    {
      userId: 6,
      pokemonPokeApiId: 197,
      status: "NOT_CAUGHT" as const,
    },
  
    // ==========================================
    // DAWN
    // ==========================================
    {
      userId: 7,
      pokemonPokeApiId: 39,
      status: "CAUGHT" as const,
    },
    {
      userId: 7,
      pokemonPokeApiId: 12,
      status: "CAUGHT" as const,
    },
    {
      userId: 7,
      pokemonPokeApiId: 10,
      status: "NOT_CAUGHT" as const,
    },
    {
      userId: 7,
      pokemonPokeApiId: 59,
      status: "CAUGHT" as const,
    },
  
    // ==========================================
    // SERENA
    // ==========================================
    {
      userId: 8,
      pokemonPokeApiId: 39,
      status: "CAUGHT" as const,
    },
    {
      userId: 8,
      pokemonPokeApiId: 25,
      status: "CAUGHT" as const,
    },
    {
      userId: 8,
      pokemonPokeApiId: 175,
      status: "NOT_CAUGHT" as const,
    },
    {
      userId: 8,
      pokemonPokeApiId: 197,
      status: "CAUGHT" as const,
    },
  
    // ==========================================
    // CLEMONT
    // ==========================================
    {
      userId: 9,
      pokemonPokeApiId: 20,
      status: "CAUGHT" as const,
    },
    {
      userId: 9,
      pokemonPokeApiId: 22,
      status: "CAUGHT" as const,
    },
    {
      userId: 9,
      pokemonPokeApiId: 94,
      status: "NOT_CAUGHT" as const,
    },
    {
      userId: 9,
      pokemonPokeApiId: 249,
      status: "CAUGHT" as const,
    },
  
    // ==========================================
    // LILLIE
    // ==========================================
    {
      userId: 10,
      pokemonPokeApiId: 175,
      status: "CAUGHT" as const,
    },
    {
      userId: 10,
      pokemonPokeApiId: 197,
      status: "CAUGHT" as const,
    },
    {
      userId: 10,
      pokemonPokeApiId: 151,
      status: "NOT_CAUGHT" as const,
    },
    {
      userId: 10,
      pokemonPokeApiId: 150,
      status: "CAUGHT" as const,
    },
  ];

  for (const collection of collections) {

    const user = createdUsers.get(collection.userId);

    const pokemon = createdPokemons.get(collection.pokemonPokeApiId);

    if (!user || !pokemon) {
      throw new Error(
        "Usuario o Pokemon no encontrado para Collection"
      );
    }

    await prisma.collection.upsert({
      where: {
        userId_pokemonId: {
          userId: user.id,
          pokemonId: pokemon.id,
        },
      },
      update: {
        status: collection.status,
      },
      create: {
        userId: user.id,
        pokemonId: pokemon.id,
        status: collection.status,
      },
    });
  }

  console.log("Seed completado.");
}

main().catch((error) => {
    console.error("Error ejecutando seed:", error);
    process.exit(1);

  }).finally(async () => {
    await prisma.$disconnect();

  });