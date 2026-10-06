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
      userId: 2,
      pokemonPokeApiId: 25,
      status: "CAUGHT" as const,
    },
    {
      userId: 2,
      pokemonPokeApiId: 4,
      status: "CAUGHT" as const,
    },
    {
      userId: 2,
      pokemonPokeApiId: 7,
      status: "NOT_CAUGHT" as const,
    },
    {
      userId: 2,
      pokemonPokeApiId: 1,
      status: "CAUGHT" as const,
    },

    {
      userId: 3,
      pokemonPokeApiId: 25,
      status: "NOT_CAUGHT" as const,
    },
    {
      userId: 3,
      pokemonPokeApiId: 7,
      status: "CAUGHT" as const,
    },
    {
      userId: 3,
      pokemonPokeApiId: 150,
      status: "NOT_CAUGHT" as const,
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