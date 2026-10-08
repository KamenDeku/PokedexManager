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