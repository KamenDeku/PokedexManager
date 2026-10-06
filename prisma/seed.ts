import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

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

async function main() {
  console.log("Iniciando seed...");

  // ==========================================
  // USERS
  // ==========================================
  const professorOak = await prisma.user.upsert({
    where: {
      id: 1,
    },
    update: {},
    create: {
      name: "Professor Oak",
      password: "oak123",
      role: "PROFESSOR",
    },
  });

  const ash = await prisma.user.upsert({
    where: {
      id: 2,
    },
    update: {},
    create: {
      name: "Ash Ketchum",
      password: "ash123",
      role: "TRAINER",
    },
  });

  const misty = await prisma.user.upsert({
    where: {
      id: 3,
    },
    update: {},
    create: {
      name: "Misty",
      password: "misty123",
      role: "TRAINER",
    },
  });

  // ==========================================
  // POKEMON
  // ==========================================
  const pikachu = await prisma.pokemon.upsert({
    where: {
      pokeApiId: 25,
    },
    update: {},
    create: {
      pokeApiId: 25,
      name: "Pikachu",
    },
  });

  const charmander = await prisma.pokemon.upsert({
    where: {
      pokeApiId: 4,
    },
    update: {},
    create: {
      pokeApiId: 4,
      name: "Charmander",
    },
  });

  const squirtle = await prisma.pokemon.upsert({
    where: {
      pokeApiId: 7,
    },
    update: {},
    create: {
      pokeApiId: 7,
      name: "Squirtle",
    },
  });

  const bulbasaur = await prisma.pokemon.upsert({
    where: {
      pokeApiId: 1,
    },
    update: {},
    create: {
      pokeApiId: 1,
      name: "Bulbasaur",
    },
  });

  const mewtwo = await prisma.pokemon.upsert({
    where: {
      pokeApiId: 150,
    },
    update: {},
    create: {
      pokeApiId: 150,
      name: "Mewtwo",
    },
  });

  // ==========================================
  // COLLECTION
  // ==========================================
  await prisma.collection.createMany({
    data: [
      {
        userId: professorOak.id,
        pokemonId: pikachu.id,
        status: "CAUGHT",
      },
      {
        userId: professorOak.id,
        pokemonId: charmander.id,
        status: "CAUGHT",
      },
      {
        userId: professorOak.id,
        pokemonId: squirtle.id,
        status: "NOT_CAUGHT",
      },

      {
        userId: ash.id,
        pokemonId: pikachu.id,
        status: "CAUGHT",
      },
      {
        userId: ash.id,
        pokemonId: charmander.id,
        status: "CAUGHT",
      },
      {
        userId: ash.id,
        pokemonId: squirtle.id,
        status: "NOT_CAUGHT",
      },
      {
        userId: ash.id,
        pokemonId: bulbasaur.id,
        status: "CAUGHT",
      },

      {
        userId: misty.id,
        pokemonId: pikachu.id,
        status: "NOT_CAUGHT",
      },
      {
        userId: misty.id,
        pokemonId: squirtle.id,
        status: "CAUGHT",
      },
      {
        userId: misty.id,
        pokemonId: mewtwo.id,
        status: "NOT_CAUGHT",
      },
    ],
  });

  console.log("Seed completado.");
}

main()
  .catch((error) => {
    console.error("Error ejecutando seed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });