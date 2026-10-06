import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ==========================================
// POST COLLECTION
// ==========================================

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { userId, pokemonId,} = body;

    if (!userId || !pokemonId) {
      return NextResponse.json(
        {
          error: "userId y pokemonId son requeridos",
        }, { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          error: "Usuario no encontrado",
        }, { status: 404 }
      );
    }

    const pokemon = await prisma.pokemon.findUnique({
      where: {
        id: pokemonId,
      },
    });

    if (!pokemon) {
      return NextResponse.json(
        {
          error: "Pokemon no encontrado",
        }, { status: 404 }
      );
    }
    
    const collection = await prisma.collection.upsert({
      where: {
        userId_pokemonId: {
          userId,
          pokemonId,
        },
      },
      update: {
        status: "CAUGHT",
      },
      create: {
        userId,
        pokemonId,
        status: "CAUGHT",
      },
      include: {
        pokemon: true,
      },
    });

    return NextResponse.json(
      collection,
      { status: 201 }
    );

  } catch (error) {

    console.error("Error en POST /api/collection:", error);

    return NextResponse.json(
      {
        error: "Error interno del servidor",
      }, { status: 500 }
    );
  }
}

// ==========================================
// GET ONE - COLLECTION
// ==========================================
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const userId =
      Number(searchParams.get("userId"));

    if (!userId) {
      return NextResponse.json(
        {
          error: "userId es requerido",
        },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          error: "Usuario no encontrado",
        }, { status: 404 }
      );
    }

    const collection =
      await prisma.collection.findMany({
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
    
    if (collection.length === 0) {
      return NextResponse.json(
        "Coleccion vacia",
        { status: 200 }
      );
    }

    return NextResponse.json(
      collection,
      { status: 200 }
    );

  } catch (error) {

    console.error("Error en GET /api/collection:", error);

    return NextResponse.json(
      {
        error: "Error interno del servidor",
      },{ status: 500 }
    );
  }
}